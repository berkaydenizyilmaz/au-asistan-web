import { successResponse, errorResponse } from "@/lib/api";
import { getTodayStr } from "@/features/meals/lib/date-utils";
import { getMealByDate } from "@/features/meals/lib/queries";

export async function GET() {
  try {
    const meal = await getMealByDate(getTodayStr());

    if (!meal) {
      return errorResponse("NOT_FOUND", "No meal found for today", 404);
    }

    return successResponse(meal);
  } catch (error) {
    return errorResponse(
      "FETCH_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
