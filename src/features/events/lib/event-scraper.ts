import * as cheerio from "cheerio";

import { AppError } from "@/lib/errors";
import type { ParsedEvent } from "../types";

const EVENTS_URL = "https://takvim.amasya.edu.tr/";

function parseDateId(id: string): string | null {
  const parts = id.split("-");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export async function scrapeEvents(): Promise<ParsedEvent[]> {
  const response = await fetch(EVENTS_URL, {
    headers: { "User-Agent": "AU-Asistan/1.0", Accept: "text/html" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AppError({
      message: `Failed to fetch events page: ${response.status} ${response.statusText}`,
      code: "SCRAPE_FAILED",
      statusCode: 502,
    });
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const results: ParsedEvent[] = [];

  $("div.schedule-block.date-div").each((_, el) => {
    const dateId = $(el).attr("id");
    if (!dateId) return;

    const eventDate = parseDateId(dateId);
    if (!eventDate) return;

    const title = $(el).find("h4 a, h4").first().text().trim();
    if (!title) return;

    const category =
      $(el).find("span.designation").first().text().trim() || "Genel";

    const organizerEl = $(el).find("i.fa-user");
    const organizer = organizerEl.length
      ? organizerEl.parent().text().trim() || null
      : null;

    const locationEl = $(el).find("i.fa-map-marker");
    const location = locationEl.length
      ? locationEl.parent().text().trim() || null
      : null;

    const href = $(el).find("h4 a").first().attr("href")?.trim();
    const sourceUrl =
      href && href !== "#" && href !== ""
        ? href.startsWith("http")
          ? href
          : `https://takvim.amasya.edu.tr${href.startsWith("/") ? "" : "/"}${href}`
        : null;

    results.push({ title, category, organizer, location, eventDate, sourceUrl });
  });

  return results;
}
