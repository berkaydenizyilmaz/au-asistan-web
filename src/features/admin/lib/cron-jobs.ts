import "server-only";

import { scrapeAllAnnouncements } from "@/features/announcements/lib/announcement-scraper";
import { upsertAnnouncements } from "@/features/announcements/lib/mutations";
import { scrapeCalendar } from "@/features/calendar/lib/calendar-scraper";
import { replaceCalendarEvents } from "@/features/calendar/lib/mutations";
import { scrapeEvents } from "@/features/events/lib/event-scraper";
import { upsertEvents } from "@/features/events/lib/mutations";
import { checkWatchedDocuments } from "@/features/knowledge/lib/mutations";
import { scrapeMeals } from "@/features/meals/lib/meal-scraper";
import { upsertMeals } from "@/features/meals/lib/mutations";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { cronRuns } from "@/lib/db/schema/cron";
import { logger } from "@/lib/logger";

export const CRON_JOB_NAMES = [
  "meals",
  "announcements",
  "events",
  "calendar",
  "knowledge",
] as const;

export type CronJobName = (typeof CRON_JOB_NAMES)[number];

export async function runCronJob(
  name: CronJobName
): Promise<{ count: number; meta?: unknown }> {
  switch (name) {
    case "meals": {
      const parsed = await scrapeMeals();
      if (parsed.length > 0) await upsertMeals(parsed);
      logger.info(`Cron meals: scraped ${parsed.length}`);
      return { count: parsed.length };
    }
    case "announcements": {
      const { results, errors } = await scrapeAllAnnouncements();
      if (results.length > 0) await upsertAnnouncements(results);
      logger.info(
        `Cron announcements: scraped ${results.length}, errors ${errors.length}`
      );
      if (errors.length > 0) logger.warn("Announcement scraping errors", { errors });
      return { count: results.length, meta: { errors } };
    }
    case "events": {
      const parsed = await scrapeEvents();
      if (parsed.length > 0) await upsertEvents(parsed);
      logger.info(`Cron events: scraped ${parsed.length}`);
      return { count: parsed.length };
    }
    case "calendar": {
      const parsed = await scrapeCalendar();
      if (parsed.length > 0) await replaceCalendarEvents(parsed);
      logger.info(`Cron calendar: scraped ${parsed.length}`);
      return {
        count: parsed.length,
        meta: parsed[0] ? { academicYear: parsed[0].academicYear } : {},
      };
    }
    case "knowledge": {
      const result = await checkWatchedDocuments();
      logger.info(
        `Cron knowledge: checked=${result.checked}, reingested=${result.reingested}`
      );
      return { count: result.reingested, meta: { checked: result.checked } };
    }
  }
}

export async function recordedCronRun(
  job: CronJobName,
  triggeredBy: "cron" | "admin"
): Promise<{ count: number; meta?: unknown }> {
  const startedAt = new Date();
  const db = await createDrizzleSupabaseClient();

  try {
    const result = await runCronJob(job);
    await db.admin.insert(cronRuns).values({
      job,
      status: "success",
      startedAt,
      completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
      resultCount: result.count,
      triggeredBy,
    });
    return result;
  } catch (error) {
    await db.admin.insert(cronRuns).values({
      job,
      status: "error",
      startedAt,
      completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
      resultCount: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
      triggeredBy,
    });
    throw error;
  }
}
