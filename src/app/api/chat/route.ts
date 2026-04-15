import { type UIMessage, convertToModelMessages, streamText } from "ai";

import { getChatModel } from "@/lib/ai/provider";
import { getSystemPrompt } from "@/lib/ai/system-prompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: getChatModel(),
    system: getSystemPrompt(),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
