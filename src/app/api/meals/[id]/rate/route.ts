import { successResponse, errorResponse } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { mealExists, getMealRatingSummary } from "@/features/meals/lib/queries";
import { upsertMealRating, deleteMealRating } from "@/features/meals/lib/mutations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    if (!(await mealExists(id))) {
      return errorResponse("NOT_FOUND", "Meal not found", 404);
    }

    // Check if current user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const summary = await getMealRatingSummary(id, user?.id);
    return successResponse(summary);
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
    if (!(await mealExists(id))) {
      return errorResponse("NOT_FOUND", "Meal not found", 404);
    }

    await upsertMealRating(id, user.id, rating);
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
    await deleteMealRating(id, user.id);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(
      "DELETE_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
