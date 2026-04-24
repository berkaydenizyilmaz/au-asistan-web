import {
  boolean,
  foreignKey,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
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
    sourceUrl: text("source_url").notNull(),
    sourceType: text("source_type").notNull(), // "html" | "pdf"
    domain: text().notNull(),
    unit: text(),
    contentHash: text("content_hash"),
    lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
    isWatched: boolean("is_watched").notNull().default(false),
    checkFrequency: text("check_frequency"), // "daily" | "weekly" | "monthly"
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    autoIngest: boolean("auto_ingest").notNull().default(false),
    metadata: jsonb().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("documents_source_url_unique").on(table.sourceUrl),
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
    embedding: vector({ dimensions: 2560 }),
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
