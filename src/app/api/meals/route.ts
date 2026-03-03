import { successResponse, handleError } from "@/lib/api";
import { getMonthRange } from "@/features/meals/lib/date-utils";
import { getMealsByDateRange } from "@/features/meals/lib/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    const currentRange = getMonthRange(now.getFullYear(), now.getMonth() + 1);
    const from = fromParam ?? currentRange.from;
    const to = toParam ?? currentRange.to;

    const result = await getMealsByDateRange(from, to);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
