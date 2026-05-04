import { successResponse, withErrorHandler } from "@/lib/api/server";
import { removeSubscription } from "@/features/notifications/lib/mutations";

export const DELETE = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await removeSubscription(id);
  return successResponse({ ok: true });
});
