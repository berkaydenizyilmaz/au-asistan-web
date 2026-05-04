import { successResponse, withErrorHandler } from "@/lib/api/server";
import { getRecentForBell } from "@/features/notifications/lib/queries";

export const GET = withErrorHandler(async () => {
  const items = await getRecentForBell(10);
  return successResponse(items);
});
