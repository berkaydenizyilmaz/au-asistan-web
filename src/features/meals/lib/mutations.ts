import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals, mealRatings } from "@/lib/db/schema/content";
import { requireUserId } from "@/lib/auth/server";
import { NotFoundError } from "@/lib/errors";
import { uuidString, parseOrThrow } from "@/lib/validation";
import type { ParsedMeal } from "../types";
import { mealRatingInputSchema } from "./validators";
import { mealExists } from "./queries";

export async function upsertMealRating(mealId: string, rating: unknown) {
  const userId = await requireUserId();
  parseOrThrow(uuidString, mealId, "Invalid meal ID");
  const parsed = parseOrThrow(
    mealRatingInputSchema,
    typeof rating === "string" ? { rating } : rating,
    'Rating must be "like" or "dislike"',
  );

  if (!(await mealExists(mealId))) {
    throw new NotFoundError("Meal not found");
  }

  const db = await createDrizzleSupabaseClient();
  await db.rls(async (tx) => {
    const existing = await tx
      .select({ id: mealRatings.id })
      .from(mealRatings)
      .where(
        and(eq(mealRatings.mealId, mealId), eq(mealRatings.userId, userId)),
      )
      .limit(1);

    if (existing.length > 0) {
      await tx
        .update(mealRatings)
        .set({ rating: parsed.rating })
        .where(eq(mealRatings.id, existing[0].id));
    } else {
      await tx
        .insert(mealRatings)
        .values({ mealId, userId, rating: parsed.rating });
    }
  });
}

export async function deleteMealRating(mealId: string) {
  const userId = await requireUserId();
  parseOrThrow(uuidString, mealId, "Invalid meal ID");

  const db = await createDrizzleSupabaseClient();
  await db.rls((tx) =>
    tx
      .delete(mealRatings)
      .where(
        and(eq(mealRatings.mealId, mealId), eq(mealRatings.userId, userId)),
      ),
  );
}

export async function upsertMeals(parsedMeals: ParsedMeal[]) {
  if (parsedMeals.length === 0) return;

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
