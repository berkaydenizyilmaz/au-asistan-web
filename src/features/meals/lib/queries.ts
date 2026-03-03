import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals, mealRatings } from "@/lib/db/schema/content";
import { ValidationError } from "@/lib/errors";
import {
  dateRangeSchema,
  dateString,
  uuidString,
  formatZodIssues,
} from "./validators";

export async function getMealsByDateRange(from: string, to: string) {
  const parsed = dateRangeSchema.safeParse({ from, to });
  if (!parsed.success) {
    throw new ValidationError("Invalid date range", formatZodIssues(parsed.error));
  }

  const db = await createDrizzleSupabaseClient();
  return db.admin
    .select()
    .from(meals)
    .where(and(gte(meals.date, parsed.data.from), lte(meals.date, parsed.data.to)))
    .orderBy(asc(meals.date));
}

export async function getMealByDate(date: string) {
  const parsed = dateString.safeParse(date);
  if (!parsed.success) {
    throw new ValidationError("Invalid date format");
  }

  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select()
    .from(meals)
    .where(eq(meals.date, parsed.data))
    .limit(1);
  return result[0] ?? null;
}

export async function mealExists(id: string) {
  const parsed = uuidString.safeParse(id);
  if (!parsed.success) {
    throw new ValidationError("Invalid meal ID");
  }

  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select({ id: meals.id })
    .from(meals)
    .where(eq(meals.id, parsed.data))
    .limit(1);
  return result.length > 0;
}

export async function getMealRatingSummary(
  mealId: string,
  userId?: string,
) {
  const parsedMealId = uuidString.safeParse(mealId);
  if (!parsedMealId.success) {
    throw new ValidationError("Invalid meal ID");
  }
  if (userId) {
    const parsedUserId = uuidString.safeParse(userId);
    if (!parsedUserId.success) {
      throw new ValidationError("Invalid user ID");
    }
  }

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
