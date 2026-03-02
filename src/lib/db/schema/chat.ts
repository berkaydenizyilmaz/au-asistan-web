import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { users } from "./users";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "conversations_user_id_fk",
    }).onDelete("cascade"),
    pgPolicy("users can read own conversations", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("users can create own conversations", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("users can update own conversations", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("users can delete own conversations", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid().primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull(),
    role: text().notNull(),
    content: text().notNull(),
    toolCalls: jsonb("tool_calls"),
    chunkCount: integer("chunk_count"),
    responseTimeMs: integer("response_time_ms"),
    hasFallback: boolean("has_fallback").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversations.id],
      name: "messages_conversation_id_fk",
    }).onDelete("cascade"),
    pgPolicy("users can read own messages", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.conversationId} in (select id from conversations where user_id = ${authUid})`,
    }),
    pgPolicy("users can create messages in own conversations", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.conversationId} in (select id from conversations where user_id = ${authUid})`,
    }),
  ]
);

export const messageFeedback = pgTable(
  "message_feedback",
  {
    id: uuid().primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull(),
    userId: uuid("user_id").notNull(),
    rating: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.messageId],
      foreignColumns: [messages.id],
      name: "message_feedback_message_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "message_feedback_user_id_fk",
    }).onDelete("cascade"),
    unique("message_feedback_message_user_unique").on(
      table.messageId,
      table.userId
    ),
    pgPolicy("users can manage own feedback", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ]
);

export type SelectConversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessageFeedback = typeof messageFeedback.$inferSelect;
export type InsertMessageFeedback = typeof messageFeedback.$inferInsert;
