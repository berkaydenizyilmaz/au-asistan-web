import { successResponse, handleError } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { getTodayStr } from "@/lib/date";
import { getMealByDate } from "@/features/meals/lib/queries";

export async function GET() {
  try {
    const meal = await getMealByDate(getTodayStr());

    if (!meal) {
      throw new NotFoundError("No meal found for today");
    }

    return successResponse(meal);
  } catch (error) {
    return handleError(error);
  }
}
