import { successResponse, withErrorHandler } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { getTodayStr } from "@/lib/date";
import { getMealByDate } from "@/features/meals/lib/queries";

export const GET = withErrorHandler(async () => {
  const meal = await getMealByDate(getTodayStr());

  if (!meal) {
    throw new NotFoundError("No meal found for today");
  }

  return successResponse(meal);
});
