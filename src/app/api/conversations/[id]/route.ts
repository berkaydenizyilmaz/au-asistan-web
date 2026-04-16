import {
  successResponse,
  withErrorHandler,
  parseJsonBody,
} from "@/lib/api/server";
import { NotFoundError } from "@/lib/errors";
import { getConversation } from "@/features/chat/lib/queries";
import {
  updateConversationTitle,
  deleteConversation,
} from "@/features/chat/lib/mutations";

export const GET = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  const conversation = await getConversation(id);
  if (!conversation) throw new NotFoundError("Conversation not found");
  return successResponse(conversation);
});

export const PATCH = withErrorHandler(async (request, context) => {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  await updateConversationTitle(id, body);
  return successResponse({ updated: true });
});

export const DELETE = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await deleteConversation(id);
  return successResponse({ deleted: true });
});
