import { sql } from "drizzle-orm";

import { env } from "@/lib/env";
import { successResponse, errorResponse } from "@/lib/api";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals } from "@/lib/db/schema/content";
import { logger } from "@/lib/logger";
import { scrapeMeals } from "@/features/meals/lib/meal-scraper";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!env.cronSecret || secret !== env.cronSecret) {
    return errorResponse("UNAUTHORIZED", "Invalid cron secret", 401);
  }

  try {
    const parsed = await scrapeMeals();
    logger.info(`Scraped ${parsed.length} meals from university website`);

    if (parsed.length === 0) {
      return successResponse({ count: 0 });
    }

    const db = await createDrizzleSupabaseClient();

    await db.admin
      .insert(meals)
      .values(
        parsed.map((meal) => ({
          date: meal.date,
          items: meal.items,
          calories: meal.calories,
        }))
      )
      .onConflictDoUpdate({
        target: meals.date,
        set: {
          items: sql`excluded.items`,
          calories: sql`excluded.calories`,
        },
      });

    logger.info(`Upserted ${parsed.length} meals`);
    return successResponse({ count: parsed.length });
  } catch (error) {
    logger.error("Cron meal scrape failed", error);
    return errorResponse(
      "SCRAPE_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
