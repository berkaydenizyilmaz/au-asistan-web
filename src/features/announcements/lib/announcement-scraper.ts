import * as cheerio from "cheerio";

import { getNowParts, getTodayStr } from "@/lib/date";
import { AppError } from "@/lib/errors";
import type { ParsedAnnouncement } from "../types";
import type { AnnouncementUnit } from "./units";
import { ANNOUNCEMENT_UNITS } from "./units";

const TURKISH_SHORT_MONTHS: Record<string, number> = {
  Oca: 1,
  Şub: 2,
  Mar: 3,
  Nis: 4,
  May: 5,
  Haz: 6,
  Tem: 7,
  Ağu: 8,
  Eyl: 9,
  Eki: 10,
  Kas: 11,
  Ara: 12,
};

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "AU-Asistan/1.0", Accept: "text/html" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new AppError({
      message: `Failed to fetch announcements: ${response.status} for ${url}`,
      code: "SCRAPE_FAILED",
      statusCode: 502,
    });
  }
  return response.text();
}

function isToday(day: number, month: number): boolean {
  const now = getNowParts();
  return day === now.day && month === now.month;
}

function parseMainSite(
  html: string,
  unit: AnnouncementUnit,
): ParsedAnnouncement[] {
  const $ = cheerio.load(html);
  const results: ParsedAnnouncement[] = [];
  const baseUrl = "https://www.amasya.edu.tr";
  const today = getTodayStr();

  $("div.duyuru").each((_, el) => {
    const dayText = $(el).find("b").first().text().trim();
    const monthText = $(el).find("span").first().text().trim();
    const anchor = $(el).find("h5 a").first();
    const title = anchor.text().trim();
    const href = anchor.attr("href")?.trim();

    if (!title || !href) return;

    const day = parseInt(dayText, 10);
    const month = TURKISH_SHORT_MONTHS[monthText];
    if (isNaN(day) || month === undefined) return;
    if (!isToday(day, month)) return;

    const sourceUrl = href.startsWith("http")
      ? href
      : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;

    results.push({ title, sourceUrl, category: unit.name, publishedAt: today });
  });

  return results;
}

function parseUnitSite(
  html: string,
  unit: AnnouncementUnit,
): ParsedAnnouncement[] {
  const $ = cheerio.load(html);
  const results: ParsedAnnouncement[] = [];
  const baseUrl = new URL(unit.url).origin;
  const today = getTodayStr();

  $("ul.upcoming-events li").each((_, el) => {
    const dayText = $(el).find("span.day").text().trim();
    const monthText = $(el).find("span.month").text().trim();
    const anchor = $(el).find("h6 a").first();
    const title = anchor.text().trim();
    const href = anchor.attr("href")?.trim();

    if (!title || !href) return;

    const day = parseInt(dayText, 10);
    const month = TURKISH_SHORT_MONTHS[monthText];
    if (isNaN(day) || month === undefined) return;
    if (!isToday(day, month)) return;

    const sourceUrl = href.startsWith("http")
      ? href
      : `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;

    results.push({ title, sourceUrl, category: unit.name, publishedAt: today });
  });

  return results;
}

async function scrapeUnit(unit: AnnouncementUnit): Promise<ParsedAnnouncement[]> {
  const html = await fetchHtml(unit.url);
  return unit.type === "main"
    ? parseMainSite(html, unit)
    : parseUnitSite(html, unit);
}

export async function scrapeAllAnnouncements(): Promise<{
  results: ParsedAnnouncement[];
  errors: { unit: string; error: string }[];
}> {
  const outcomes = await Promise.allSettled(
    ANNOUNCEMENT_UNITS.map(async (unit) => {
      try {
        return { unit: unit.key, parsed: await scrapeUnit(unit) };
      } catch (err) {
        throw { unit: unit.key, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  );

  const results: ParsedAnnouncement[] = [];
  const errors: { unit: string; error: string }[] = [];

  for (const outcome of outcomes) {
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value.parsed);
    } else {
      errors.push(outcome.reason as { unit: string; error: string });
    }
  }

  return { results, errors };
}
