import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { conversations, messages, messageFeedback } from "@/lib/db/schema/chat";
import { requireUserId } from "@/lib/auth/server";
import { parseOrThrow, uuidString } from "@/lib/validation";
import type {
  ConversationDTO,
  ConversationWithMessagesDTO,
  MessageDTO,
} from "../types";

function toConversationDTO(row: {
  id: string;
  title: string | null;
  updatedAt: Date;
}): ConversationDTO {
  return {
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMessageDTO(
  row: {
    id: string;
    role: string;
    content: string;
    toolCalls: unknown;
    createdAt: Date;
  },
  feedback?: string | null,
): MessageDTO {
  return {
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content,
    toolCalls: row.toolCalls ?? null,
    createdAt: row.createdAt.toISOString(),
    feedback: (feedback as "like" | "dislike") ?? null,
  };
}

export async function getConversations(): Promise<ConversationDTO[]> {
  await requireUserId();

  const db = await createDrizzleSupabaseClient();
  const rows = await db.rls((tx) =>
    tx
      .select({
        id: conversations.id,
        title: conversations.title,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(50)
  );

  return rows.map(toConversationDTO);
}

export async function getConversation(
  id: string,
): Promise<ConversationWithMessagesDTO | null> {
  await requireUserId();
  parseOrThrow(uuidString, id, "Invalid conversation ID");

  const db = await createDrizzleSupabaseClient();

  const conversationRows = await db.rls((tx) =>
    tx
      .select({
        id: conversations.id,
        title: conversations.title,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1)
  );

  if (conversationRows.length === 0) return null;

  const messageRows = await db.rls((tx) =>
    tx
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        toolCalls: messages.toolCalls,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt))
  );

  const feedbackRows =
    messageRows.length > 0
      ? await db.rls((tx) =>
          tx
            .select({
              messageId: messageFeedback.messageId,
              rating: messageFeedback.rating,
            })
            .from(messageFeedback)
            .where(inArray(messageFeedback.messageId, messageRows.map((m) => m.id)))
        )
      : [];

  const feedbackMap = new Map(feedbackRows.map((r) => [r.messageId, r.rating]));

  return {
    ...toConversationDTO(conversationRows[0]),
    messages: messageRows.map((row) => toMessageDTO(row, feedbackMap.get(row.id))),
  };
}
