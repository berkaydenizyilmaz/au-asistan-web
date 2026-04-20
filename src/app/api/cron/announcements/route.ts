import { scrapeAllAnnouncements } from "@/features/announcements/lib/announcement-scraper";
import { upsertAnnouncements } from "@/features/announcements/lib/mutations";
import { successResponse, withCronAuth } from "@/lib/api/server";
import { logger } from "@/lib/logger";

export const POST = withCronAuth(async () => {
  const { results, errors } = await scrapeAllAnnouncements();
  logger.info(
    `Scraped ${results.length} announcements, ${errors.length} unit errors`,
  );

  if (errors.length > 0) {
    logger.warn("Announcement scraping errors", { errors });
  }

  if (results.length > 0) await upsertAnnouncements(results);

  return successResponse({ scraped: results.length, errors });
});
