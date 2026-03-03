import { successResponse, handleError } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { mealExists, getMealRatingSummary } from "@/features/meals/lib/queries";
import { upsertMealRating, deleteMealRating } from "@/features/meals/lib/mutations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!(await mealExists(id))) {
      throw new NotFoundError("Meal not found");
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return successResponse(await getMealRatingSummary(id, user?.id));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await upsertMealRating(id, body.rating);
    return successResponse({ rating: body.rating });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteMealRating(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
