import { successResponse, withCronAuth } from "@/lib/api/server";
import { logger } from "@/lib/logger";
import { scrapeMeals } from "@/features/meals/lib/meal-scraper";
import { upsertMeals } from "@/features/meals/lib/mutations";

export const POST = withCronAuth(async () => {
  const parsed = await scrapeMeals();
  logger.info(`Scraped ${parsed.length} meals from university website`);

  if (parsed.length === 0) {
    return successResponse({ count: 0 });
  }

  await upsertMeals(parsed);
  logger.info(`Upserted ${parsed.length} meals`);
  return successResponse({ count: parsed.length });
});
