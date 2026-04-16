import type { UIMessage } from "ai";

import type { MessageDTO } from "../types";

export function toUIMessages(dbMessages: MessageDTO[]): UIMessage[] {
  return dbMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: [{ type: "text" as const, text: msg.content }],
  }));
}

export function extractTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
