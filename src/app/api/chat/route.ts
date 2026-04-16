import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from "ai";

import { getChatModel } from "@/lib/ai/provider";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import { chatTools } from "@/lib/ai/tools";
import { getOptionalUser } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import {
  createConversation,
  saveMessages,
  updateConversationTimestamp,
} from "@/features/chat/lib/mutations";
import { extractTextContent } from "@/features/chat/lib/message-utils";

export const maxDuration = 60;

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
    tools: chatTools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, steps }) => {
      if (!user || !conversationId) return;

      try {
        const allToolCalls = steps
          .flatMap((step) => step.toolCalls ?? [])
          .map(({ toolName, input }) => ({ toolName, args: input }));

        await saveMessages(conversationId, [
          {
            role: "assistant",
            content: text,
            toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
          },
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
