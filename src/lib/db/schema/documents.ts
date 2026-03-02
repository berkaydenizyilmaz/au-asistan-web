import {
  foreignKey,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

export const documents = pgTable(
  "documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    sourceType: text("source_type").notNull(),
    sourceUrl: text("source_url"),
    fileName: text("file_name"),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [
    pgPolicy("anyone can read documents", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ]
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid().primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull(),
    content: text().notNull(),
    embedding: vector({ dimensions: 1536 }),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [documents.id],
      name: "document_chunks_document_id_fk",
    }).onDelete("cascade"),
    pgPolicy("anyone can read document chunks", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ]
);

export type SelectDocument = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;
