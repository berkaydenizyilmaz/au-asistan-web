import { successResponse, withErrorHandler } from "@/lib/api/server";
import { markAsRead } from "@/features/notifications/lib/mutations";

export const PATCH = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await markAsRead(id);
  return successResponse({ ok: true });
});
