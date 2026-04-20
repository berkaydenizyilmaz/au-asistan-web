import type { UIMessage } from "ai";

import type { MessageDTO } from "../types";

interface StoredToolCall {
  toolCallId: string;
  toolName: string;
  args: unknown;
  result?: unknown;
}

export function toUIMessages(dbMessages: MessageDTO[]): UIMessage[] {
  return dbMessages.map((msg) => {
    const parts: UIMessage["parts"] = [];

    if (msg.role === "assistant" && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
      for (const tc of msg.toolCalls as StoredToolCall[]) {
        if (tc.toolCallId && tc.result !== undefined) {
          parts.push({
            type: "dynamic-tool",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            state: "output-available",
            input: tc.args,
            output: tc.result,
          });
        }
      }
    }

    parts.push({ type: "text", text: msg.content });

    return {
      id: msg.id,
      role: msg.role,
      parts,
    };
  });
}

export function extractTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
