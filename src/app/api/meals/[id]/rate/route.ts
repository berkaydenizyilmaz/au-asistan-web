import { and, eq, sql } from "drizzle-orm";

import { successResponse, errorResponse } from "@/lib/api";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals, mealRatings } from "@/lib/db/schema/content";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const db = await createDrizzleSupabaseClient();

    // Verify meal exists
    const meal = await db.admin
      .select({ id: meals.id })
      .from(meals)
      .where(eq(meals.id, id))
      .limit(1);

    if (meal.length === 0) {
      return errorResponse("NOT_FOUND", "Meal not found", 404);
    }

    // Get aggregated rating counts
    const counts = await db.admin
      .select({
        likes: sql<number>`count(*) filter (where ${mealRatings.rating} = 'like')`,
        dislikes: sql<number>`count(*) filter (where ${mealRatings.rating} = 'dislike')`,
      })
      .from(mealRatings)
      .where(eq(mealRatings.mealId, id));

    // Check if current user has rated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userRating: string | null = null;
    if (user) {
      const userRate = await db.admin
        .select({ rating: mealRatings.rating })
        .from(mealRatings)
        .where(
          and(eq(mealRatings.mealId, id), eq(mealRatings.userId, user.id))
        )
        .limit(1);

      if (userRate.length > 0) {
        userRating = userRate[0].rating;
      }
    }

    return successResponse({
      likes: Number(counts[0]?.likes ?? 0),
      dislikes: Number(counts[0]?.dislikes ?? 0),
      userRating,
    });
  } catch (error) {
    return errorResponse(
      "FETCH_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Login required", 401);
  }

  const body = await request.json();
  const { rating } = body as { rating: string };

  if (!rating || !["like", "dislike"].includes(rating)) {
    return errorResponse(
      "INVALID_RATING",
      'Rating must be "like" or "dislike"',
      400
    );
  }

  try {
    const db = await createDrizzleSupabaseClient();

    // Verify meal exists
    const meal = await db.admin
      .select({ id: meals.id })
      .from(meals)
      .where(eq(meals.id, id))
      .limit(1);

    if (meal.length === 0) {
      return errorResponse("NOT_FOUND", "Meal not found", 404);
    }

    // Upsert rating via RLS client
    const existing = await db.rls(async (tx) => {
      return tx
        .select({ id: mealRatings.id })
        .from(mealRatings)
        .where(
          and(
            eq(mealRatings.mealId, id),
            eq(mealRatings.userId, user.id)
          )
        )
        .limit(1);
    });

    if (existing.length > 0) {
      await db.rls(async (tx) => {
        return tx
          .update(mealRatings)
          .set({ rating })
          .where(eq(mealRatings.id, existing[0].id));
      });
    } else {
      await db.rls(async (tx) => {
        return tx.insert(mealRatings).values({
          mealId: id,
          userId: user.id,
          rating,
        });
      });
    }

    return successResponse({ rating });
  } catch (error) {
    return errorResponse(
      "RATE_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Login required", 401);
  }

  try {
    const db = await createDrizzleSupabaseClient();

    await db.rls(async (tx) => {
      return tx
        .delete(mealRatings)
        .where(
          and(
            eq(mealRatings.mealId, id),
            eq(mealRatings.userId, user.id)
          )
        );
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(
      "DELETE_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
