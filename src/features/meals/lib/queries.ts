import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals, mealRatings } from "@/lib/db/schema/content";

// Fetch meals within a date range, ordered by date
export async function getMealsByDateRange(from: string, to: string) {
  const db = await createDrizzleSupabaseClient();
  return db.admin
    .select()
    .from(meals)
    .where(and(gte(meals.date, from), lte(meals.date, to)))
    .orderBy(asc(meals.date));
}

// Fetch a single meal by exact date, returns null if not found
export async function getMealByDate(date: string) {
  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select()
    .from(meals)
    .where(eq(meals.date, date))
    .limit(1);
  return result[0] ?? null;
}

// Check if a meal exists by ID
export async function mealExists(id: string) {
  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select({ id: meals.id })
    .from(meals)
    .where(eq(meals.id, id))
    .limit(1);
  return result.length > 0;
}

// Get aggregated rating counts and optionally the current user's rating
export async function getMealRatingSummary(
  mealId: string,
  userId?: string,
) {
  const db = await createDrizzleSupabaseClient();

  const counts = await db.admin
    .select({
      likes: sql<number>`count(*) filter (where ${mealRatings.rating} = 'like')`,
      dislikes: sql<number>`count(*) filter (where ${mealRatings.rating} = 'dislike')`,
    })
    .from(mealRatings)
    .where(eq(mealRatings.mealId, mealId));

  let userRating: string | null = null;
  if (userId) {
    const userRate = await db.admin
      .select({ rating: mealRatings.rating })
      .from(mealRatings)
      .where(
        and(
          eq(mealRatings.mealId, mealId),
          eq(mealRatings.userId, userId),
        ),
      )
      .limit(1);
    userRating = userRate[0]?.rating ?? null;
  }

  return {
    likes: Number(counts[0]?.likes ?? 0),
    dislikes: Number(counts[0]?.dislikes ?? 0),
    userRating,
  };
}
