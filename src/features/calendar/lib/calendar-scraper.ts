import * as cheerio from "cheerio";
import { extractText, getDocumentProxy } from "unpdf";

import { AppError } from "@/lib/errors";
import type { ParsedCalendarEvent, Semester } from "../types";

const CALENDAR_LIST_URL = "https://oidb.amasya.edu.tr/akademik-takvim";

const TURKISH_MONTHS: Record<string, string> = {
  Ocak: "01",
  Şubat: "02",
  Mart: "03",
  Nisan: "04",
  Mayıs: "05",
  Haziran: "06",
  Temmuz: "07",
  Ağustos: "08",
  Eylül: "09",
  Ekim: "10",
  Kasım: "11",
  Aralık: "12",
};

const MONTH_PATTERN = Object.keys(TURKISH_MONTHS).join("|");

// Matches Turkish date patterns anywhere in text (no $ anchor — works on continuous text):
// "5 Eylül 2025", "8-12 Eylül 2025", "8 Kasım - 30 Kasım 2025",
// "26 Ocak-1 Şubat 2026", "31 Ağustos – 11 Eylül 2026"
const DATE_REGEX_GLOBAL = new RegExp(
  `(\\d{1,2})(?:\\s*[-–]\\s*(\\d{1,2}))?\\s+(${MONTH_PATTERN})(?:\\s*[-–]\\s*(\\d{1,2})\\s+(${MONTH_PATTERN}))?\\s+(\\d{4})`,
  "g",
);

// Noise patterns to strip from extracted titles
const TITLE_NOISE_PATTERNS = [
  /AMASYA\s+ÜNİVERSİTESİ.*?AKADEMİK\s+TAKVİMİ/gi,
  /\(LİSANS[^)]*\)/gi,
  /\(Tıp\s+Fakültesi[^)]*\)/gi,
  /GÜZ\s+YARIYILI/gi,
  /BAHAR\s+YARIYILI/gi,
];

function toDateStr(day: string, month: string, year: string): string {
  const mm = TURKISH_MONTHS[month];
  if (!mm) return "";
  return `${year}-${mm}-${day.padStart(2, "0")}`;
}

function parseAcademicYear(headerText: string): string | null {
  const match = headerText.match(/(\d{4})-(\d{4})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

function parseEvents(text: string): ParsedCalendarEvent[] {
  const academicYear = parseAcademicYear(text);
  if (!academicYear) return [];

  // PDF text comes as a single continuous string (no newlines, no double spaces).
  // Strategy: find all date matches, extract the text between consecutive dates as titles.
  const matches = [...text.matchAll(DATE_REGEX_GLOBAL)];
  if (matches.length === 0) return [];

  const events: ParsedCalendarEvent[] = [];
  let currentSemester: Semester = "fall";
  let prevEnd = 0;

  for (const match of matches) {
    const matchIndex = match.index!;
    const textBefore = text.substring(prevEnd, matchIndex).trim();
    prevEnd = matchIndex + match[0].length;

    // Detect semester transitions in the text between dates
    if (/BAHAR\s+YARIYILI/i.test(textBefore)) {
      currentSemester = "spring";
    }

    // Stop at explanation section
    if (/Açıklama/i.test(textBefore)) break;

    // Clean title: remove header noise, semester markers, extra whitespace
    let title = textBefore;
    for (const pattern of TITLE_NOISE_PATTERNS) {
      title = title.replace(pattern, "");
    }
    title = title.replace(/\s+/g, " ").trim();

    if (!title) continue;

    const [, startDay, endDaySameMonth, startMonth, endDayCrossMonth, endMonthCross, year] = match;

    const startDate = toDateStr(startDay, startMonth, year);
    if (!startDate) continue;

    let endDate: string | undefined;
    if (endDayCrossMonth && endMonthCross) {
      endDate = toDateStr(endDayCrossMonth, endMonthCross, year) || undefined;
    } else if (endDaySameMonth) {
      endDate = toDateStr(endDaySameMonth, startMonth, year) || undefined;
    }

    events.push({
      title,
      startDate,
      endDate,
      semester: currentSemester,
      academicYear,
      sortOrder: events.length,
    });
  }

  return events;
}

async function findLatestCalendarPdfUrl(): Promise<string> {
  const response = await fetch(CALENDAR_LIST_URL, {
    headers: { "User-Agent": "AU-Asistan/1.0", Accept: "text/html" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new AppError({
      message: `Failed to fetch calendar list page: ${response.status}`,
      code: "SCRAPE_FAILED",
      statusCode: 502,
    });
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Find the first calendar link (most recent year)
  const firstLink = $("a[href*='akademik-takvim']").first();
  if (!firstLink.length) {
    throw new AppError({
      message: "No academic calendar link found on listing page",
      code: "SCRAPE_PARSE_FAILED",
      statusCode: 502,
    });
  }

  const href = firstLink.attr("href");
  if (!href) {
    throw new AppError({
      message: "Calendar link has no href",
      code: "SCRAPE_PARSE_FAILED",
      statusCode: 502,
    });
  }

  // Resolve relative URL
  const baseUrl = new URL(CALENDAR_LIST_URL);
  const calendarPageUrl = new URL(href, baseUrl).toString();

  // Follow redirects to get the final PDF URL
  const pdfResponse = await fetch(calendarPageUrl, {
    headers: { "User-Agent": "AU-Asistan/1.0" },
    redirect: "follow",
  });

  if (!pdfResponse.ok) {
    throw new AppError({
      message: `Failed to follow calendar link: ${pdfResponse.status}`,
      code: "SCRAPE_FAILED",
      statusCode: 502,
    });
  }

  const contentType = pdfResponse.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf")) {
    throw new AppError({
      message: `Expected PDF but got ${contentType}`,
      code: "SCRAPE_PARSE_FAILED",
      statusCode: 502,
    });
  }

  return pdfResponse.url;
}

async function extractPdfText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "AU-Asistan/1.0" },
  });

  if (!response.ok) {
    throw new AppError({
      message: `Failed to fetch PDF: ${response.status}`,
      code: "SCRAPE_FAILED",
      statusCode: 502,
    });
  }

  const buffer = await response.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });

  if (!text || (typeof text === "string" && text.trim().length === 0)) {
    throw new AppError({
      message: "PDF text extraction returned empty content",
      code: "SCRAPE_PARSE_FAILED",
      statusCode: 502,
    });
  }

  return text as string;
}

/**
 * Spring events whose start date falls in the first year of the academic year
 * are misclassified by the PDF parser — the university places them at the end
 * of the spring section, but they chronologically precede the fall semester.
 * Move them to "fall" and place them at the very beginning of the event list.
 */
function correctSemesterAssignment(
  events: ParsedCalendarEvent[],
): ParsedCalendarEvent[] {
  if (events.length === 0) return events;

  const firstYear = parseInt(events[0].academicYear.split("-")[0], 10);

  const preFall: ParsedCalendarEvent[] = [];
  const fall: ParsedCalendarEvent[] = [];
  const spring: ParsedCalendarEvent[] = [];

  for (const event of events) {
    const eventYear = parseInt(event.startDate.split("-")[0], 10);

    if (event.semester === "spring" && eventYear === firstYear) {
      preFall.push({ ...event, semester: "fall" });
    } else if (event.semester === "fall") {
      fall.push(event);
    } else {
      spring.push(event);
    }
  }

  return [...preFall, ...fall, ...spring].map((e, i) => ({
    ...e,
    sortOrder: i,
  }));
}

export async function scrapeCalendar(): Promise<ParsedCalendarEvent[]> {
  const pdfUrl = await findLatestCalendarPdfUrl();
  const text = await extractPdfText(pdfUrl);
  const events = parseEvents(text);

  if (events.length === 0) {
    throw new AppError({
      message: "No calendar events parsed from PDF",
      code: "SCRAPE_PARSE_FAILED",
      statusCode: 502,
    });
  }

  return correctSemesterAssignment(events);
}
