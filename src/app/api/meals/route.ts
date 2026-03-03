import { successResponse, errorResponse } from "@/lib/api";
import { getMonthRange } from "@/features/meals/lib/date-utils";
import { getMealsByDateRange } from "@/features/meals/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Default to current month if no range provided
  const now = new Date();
  const currentRange = getMonthRange(now.getFullYear(), now.getMonth() + 1);
  const defaultFrom = fromParam ?? currentRange.from;
  const defaultTo = toParam ?? currentRange.to;

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(defaultFrom) || !dateRegex.test(defaultTo)) {
    return errorResponse(
      "INVALID_DATE",
      "Date parameters must be in YYYY-MM-DD format",
      400
    );
  }

  try {
    const result = await getMealsByDateRange(defaultFrom, defaultTo);
    return successResponse(result);
  } catch (error) {
    return errorResponse(
      "FETCH_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
