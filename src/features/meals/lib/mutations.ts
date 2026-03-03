import { and, eq, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals, mealRatings } from "@/lib/db/schema/content";
import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError, NotFoundError, ValidationError } from "@/lib/errors";
import type { ParsedMeal } from "../types";
import { uuidString, mealRatingInputSchema } from "./validators";
import { mealExists } from "./queries";

async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  return user.id;
}

export async function upsertMealRating(mealId: string, rating: unknown) {
  const userId = await requireAuth();

  const parsedId = uuidString.safeParse(mealId);
  if (!parsedId.success) throw new ValidationError("Invalid meal ID");

  const parsedRating = mealRatingInputSchema.safeParse(
    typeof rating === "string" ? { rating } : rating,
  );
  if (!parsedRating.success) {
    throw new ValidationError('Rating must be "like" or "dislike"');
  }

  if (!(await mealExists(mealId))) {
    throw new NotFoundError("Meal not found");
  }

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
      .set({ rating: parsedRating.data.rating })
      .where(eq(mealRatings.id, existing[0].id));
  } else {
    await db.admin
      .insert(mealRatings)
      .values({ mealId, userId, rating: parsedRating.data.rating });
  }
}

export async function deleteMealRating(mealId: string) {
  const userId = await requireAuth();

  const parsedId = uuidString.safeParse(mealId);
  if (!parsedId.success) throw new ValidationError("Invalid meal ID");

  const db = await createDrizzleSupabaseClient();
  await db.admin
    .delete(mealRatings)
    .where(
      and(eq(mealRatings.mealId, mealId), eq(mealRatings.userId, userId)),
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
