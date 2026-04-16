import { successResponse, withErrorHandler } from "@/lib/api/server";
import { getConversations } from "@/features/chat/lib/queries";

export const GET = withErrorHandler(async () => {
  const conversations = await getConversations();
  return successResponse(conversations);
});
