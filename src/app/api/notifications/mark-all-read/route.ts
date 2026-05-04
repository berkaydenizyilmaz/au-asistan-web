import { successResponse, withErrorHandler } from "@/lib/api/server";
import { markAllAsRead } from "@/features/notifications/lib/mutations";

export const POST = withErrorHandler(async () => {
  const result = await markAllAsRead();
  return successResponse(result);
});
