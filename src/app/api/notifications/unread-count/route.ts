import { successResponse, withErrorHandler } from "@/lib/api/server";
import { getUnreadCount } from "@/features/notifications/lib/queries";

export const GET = withErrorHandler(async () => {
  const count = await getUnreadCount();
  return successResponse({ count });
});
