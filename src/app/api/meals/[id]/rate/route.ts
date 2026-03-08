import { successResponse, handleError, parseJsonBody } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { getOptionalUser } from "@/lib/auth/server";
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

    const user = await getOptionalUser();

    return successResponse(await getMealRatingSummary(id, user?.id));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    await upsertMealRating(id, body);
    return successResponse({ success: true });
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
