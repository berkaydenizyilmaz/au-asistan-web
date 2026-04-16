import { type UIMessage, convertToModelMessages, streamText } from "ai";

import { getChatModel } from "@/lib/ai/provider";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import { getOptionalUser } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import {
  createConversation,
  saveMessages,
  updateConversationTimestamp,
} from "@/features/chat/lib/mutations";
import { extractTextContent } from "@/features/chat/lib/message-utils";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    chatId,
  }: { messages: UIMessage[]; chatId?: string } = await req.json();

  const user = await getOptionalUser();
  let conversationId = chatId ?? null;
  const isNewConversation = user && !conversationId;

  if (isNewConversation) {
    const lastUserMsg = messages[messages.length - 1];
    const title = lastUserMsg
      ? extractTextContent(lastUserMsg).slice(0, 100)
      : null;
    conversationId = await createConversation(title ?? undefined);
  }

  if (user && conversationId) {
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      await saveMessages(conversationId, [
        {
          role: "user",
          content: extractTextContent(lastUserMsg),
        },
      ]);
    }
  }

  const result = streamText({
    model: getChatModel(),
    system: getSystemPrompt(),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      if (!user || !conversationId) return;

      try {
        await saveMessages(conversationId, [
          { role: "assistant", content: text },
        ]);
        await updateConversationTimestamp(conversationId);
      } catch (error) {
        logger.error("Failed to save assistant message", error);
      }
    },
  });

  const response = result.toUIMessageStreamResponse();

  if (isNewConversation && conversationId) {
    response.headers.set("X-Conversation-Id", conversationId);
  }

  return response;
}
