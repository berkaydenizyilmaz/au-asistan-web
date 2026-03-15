import { successResponse, withErrorHandler } from "@/lib/api/server";
import { getNowParts } from "@/lib/date";
import { getMonthRange } from "@/features/meals/lib/date-utils";
import { getMealsByDateRange } from "@/features/meals/lib/queries";

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = getNowParts();
  const currentRange = getMonthRange(now.year, now.month);
  const from = fromParam ?? currentRange.from;
  const to = toParam ?? currentRange.to;

  const result = await getMealsByDateRange(from, to);
  return successResponse(result);
});
