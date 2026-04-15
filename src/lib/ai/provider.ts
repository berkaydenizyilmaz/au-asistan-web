import "server-only";

import { createOpenAI } from "@ai-sdk/openai";

import { env } from "@/lib/env";

const openai = createOpenAI({
  baseURL: env.aiBaseUrl,
  apiKey: env.aiApiKey,
  name: "au-asistan-ai",
});

export function getChatModel() {
  return openai.chat(env.aiChatModel);
}
