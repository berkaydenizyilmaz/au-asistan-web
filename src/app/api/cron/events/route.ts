import { scrapeEvents } from "@/features/events/lib/event-scraper";
import { upsertEvents } from "@/features/events/lib/mutations";
import { successResponse, withCronAuth } from "@/lib/api/server";
import { logger } from "@/lib/logger";

export const POST = withCronAuth(async () => {
  const parsed = await scrapeEvents();
  logger.info(`Scraped ${parsed.length} events from university calendar`);

  if (parsed.length > 0) await upsertEvents(parsed);

  return successResponse({ scraped: parsed.length });
});
