import "server-only";

import { and, eq } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { conversations, messages, messageFeedback } from "@/lib/db/schema/chat";
import { requireUserId } from "@/lib/auth/server";
import { NotFoundError } from "@/lib/errors";
import { parseOrThrow, uuidString } from "@/lib/validation";
import { messageFeedbackInputSchema, updateConversationTitleSchema } from "./validators";

export async function createConversation(title?: string): Promise<string> {
  const userId = await requireUserId();

  const db = await createDrizzleSupabaseClient();
  const rows = await db.rls((tx) =>
    tx
      .insert(conversations)
      .values({ userId, title: title ?? null })
      .returning({ id: conversations.id })
  );

  return rows[0].id;
}

export async function saveMessages(
  conversationId: string,
  msgs: { id?: string; role: string; content: string; toolCalls?: unknown }[],
) {
  await requireUserId();
  parseOrThrow(uuidString, conversationId, "Invalid conversation ID");
  if (msgs.length === 0) return;

  const db = await createDrizzleSupabaseClient();
  await db.rls((tx) =>
    tx.insert(messages).values(
      msgs.map((m) => ({
        ...(m.id ? { id: m.id } : {}),
        conversationId,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls ?? null,
      }))
    )
  );
}

export async function updateConversationTitle(id: string, title: unknown) {
  await requireUserId();
  parseOrThrow(uuidString, id, "Invalid conversation ID");
  const parsed = parseOrThrow(
    updateConversationTitleSchema,
    typeof title === "string" ? { title } : title,
    "Invalid title",
  );

  const db = await createDrizzleSupabaseClient();
  const rows = await db.rls((tx) =>
    tx
      .update(conversations)
      .set({ title: parsed.title })
      .where(eq(conversations.id, id))
      .returning({ id: conversations.id })
  );

  if (rows.length === 0) throw new NotFoundError("Conversation not found");
}

export async function updateConversationTimestamp(id: string) {
  await requireUserId();
  parseOrThrow(uuidString, id, "Invalid conversation ID");

  const db = await createDrizzleSupabaseClient();
  await db.rls((tx) =>
    tx
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id))
  );
}

export async function deleteConversation(id: string) {
  await requireUserId();
  parseOrThrow(uuidString, id, "Invalid conversation ID");

  const db = await createDrizzleSupabaseClient();
  const rows = await db.rls((tx) =>
    tx
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning({ id: conversations.id })
  );

  if (rows.length === 0) throw new NotFoundError("Conversation not found");
}

export async function upsertMessageFeedback(
  messageId: string,
  input: unknown,
): Promise<void> {
  const userId = await requireUserId();
  parseOrThrow(uuidString, messageId, "Invalid message ID");
  const { rating } = parseOrThrow(
    messageFeedbackInputSchema,
    input,
    "Rating must be \"like\" or \"dislike\"",
  );

  const db = await createDrizzleSupabaseClient();
  await db.rls((tx) =>
    tx
      .insert(messageFeedback)
      .values({ messageId, userId, rating })
      .onConflictDoUpdate({
        target: [messageFeedback.messageId, messageFeedback.userId],
        set: { rating },
      }),
  );
}

export async function deleteMessageFeedback(messageId: string): Promise<void> {
  const userId = await requireUserId();
  parseOrThrow(uuidString, messageId, "Invalid message ID");

  const db = await createDrizzleSupabaseClient();
  await db.rls((tx) =>
    tx
      .delete(messageFeedback)
      .where(
        and(
          eq(messageFeedback.messageId, messageId),
          eq(messageFeedback.userId, userId),
        ),
      ),
  );
}
