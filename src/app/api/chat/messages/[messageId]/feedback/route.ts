import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import {
  deleteMessageFeedback,
  upsertMessageFeedback,
} from "@/features/chat/lib/mutations";

export const POST = withErrorHandler(async (request, context) => {
  const { messageId } = await context.params;
  const body = await parseJsonBody(request);
  await upsertMessageFeedback(messageId, body);
  return successResponse({ success: true });
});

export const DELETE = withErrorHandler(async (_request, context) => {
  const { messageId } = await context.params;
  await deleteMessageFeedback(messageId);
  return successResponse({ deleted: true });
});
