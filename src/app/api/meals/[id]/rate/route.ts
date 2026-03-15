import { successResponse, withErrorHandler, parseJsonBody } from "@/lib/api/server";
import { NotFoundError } from "@/lib/errors";
import { getOptionalUser } from "@/lib/auth/server";
import { mealExists, getMealRatingSummary } from "@/features/meals/lib/queries";
import { upsertMealRating, deleteMealRating } from "@/features/meals/lib/mutations";

export const GET = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;

  if (!(await mealExists(id))) {
    throw new NotFoundError("Meal not found");
  }

  const user = await getOptionalUser();
  return successResponse(await getMealRatingSummary(id, user?.id));
});

export const POST = withErrorHandler(async (request, context) => {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  await upsertMealRating(id, body);
  return successResponse({ success: true });
});

export const DELETE = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await deleteMealRating(id);
  return successResponse({ deleted: true });
});
