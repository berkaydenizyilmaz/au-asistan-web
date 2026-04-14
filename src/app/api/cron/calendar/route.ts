import { successResponse, withCronAuth } from "@/lib/api/server";
import { logger } from "@/lib/logger";
import { scrapeCalendar } from "@/features/calendar/lib/calendar-scraper";
import { replaceCalendarEvents } from "@/features/calendar/lib/mutations";

export const POST = withCronAuth(async () => {
  const parsed = await scrapeCalendar();
  logger.info(`Scraped ${parsed.length} calendar events`);

  if (parsed.length === 0) {
    return successResponse({ count: 0 });
  }

  await replaceCalendarEvents(parsed);
  logger.info(`Replaced calendar events for ${parsed[0].academicYear}`);
  return successResponse({ count: parsed.length, academicYear: parsed[0].academicYear });
});
