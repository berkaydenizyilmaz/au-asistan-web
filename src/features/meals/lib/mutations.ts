import { and, eq, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals, mealRatings } from "@/lib/db/schema/content";
import type { ParsedMeal } from "../types";

// Upsert a meal rating (insert or update if already exists)
export async function upsertMealRating(
  mealId: string,
  userId: string,
  rating: string,
) {
  const db = await createDrizzleSupabaseClient();

  const existing = await db.admin
    .select({ id: mealRatings.id })
    .from(mealRatings)
    .where(
      and(eq(mealRatings.mealId, mealId), eq(mealRatings.userId, userId)),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.admin
      .update(mealRatings)
      .set({ rating })
      .where(eq(mealRatings.id, existing[0].id));
  } else {
    await db.admin
      .insert(mealRatings)
      .values({ mealId, userId, rating });
  }
}

// Delete a user's rating for a meal
export async function deleteMealRating(mealId: string, userId: string) {
  const db = await createDrizzleSupabaseClient();
  await db.admin
    .delete(mealRatings)
    .where(
      and(eq(mealRatings.mealId, mealId), eq(mealRatings.userId, userId)),
    );
}

// Bulk upsert scraped meals (used by cron job)
export async function upsertMeals(parsedMeals: ParsedMeal[]) {
  const db = await createDrizzleSupabaseClient();
  await db.admin
    .insert(meals)
    .values(
      parsedMeals.map((m) => ({
        date: m.date,
        items: m.items,
        calories: m.calories,
      })),
    )
    .onConflictDoUpdate({
      target: meals.date,
      set: {
        items: sql`excluded.items`,
        calories: sql`excluded.calories`,
      },
    });
}
