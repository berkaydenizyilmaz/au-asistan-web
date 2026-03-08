import "server-only";

import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals, mealRatings } from "@/lib/db/schema/content";
import { uuidString, dateString, parseOrThrow } from "@/lib/validation";
import type { MealDTO, MealItem } from "../types";
import { dateRangeSchema } from "./validators";

function toMealDTO(row: { id: string; date: string; items: unknown; calories: number | null }): MealDTO {
  return { id: row.id, date: row.date, items: row.items as MealItem[], calories: row.calories };
}

export async function getMealsByDateRange(from: string, to: string) {
  const parsed = parseOrThrow(dateRangeSchema, { from, to }, "Invalid date range");

  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .select()
    .from(meals)
    .where(and(gte(meals.date, parsed.from), lte(meals.date, parsed.to)))
    .orderBy(asc(meals.date));
  return rows.map(toMealDTO);
}

export async function getMealByDate(date: string) {
  const parsed = parseOrThrow(dateString, date, "Invalid date format");

  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select()
    .from(meals)
    .where(eq(meals.date, parsed))
    .limit(1);
  return result[0] ? toMealDTO(result[0]) : null;
}

export async function mealExists(id: string) {
  parseOrThrow(uuidString, id, "Invalid meal ID");

  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select({ id: meals.id })
    .from(meals)
    .where(eq(meals.id, id))
    .limit(1);
  return result.length > 0;
}

export async function getMealRatingSummary(
  mealId: string,
  userId?: string,
) {
  parseOrThrow(uuidString, mealId, "Invalid meal ID");
  if (userId) {
    parseOrThrow(uuidString, userId, "Invalid user ID");
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
