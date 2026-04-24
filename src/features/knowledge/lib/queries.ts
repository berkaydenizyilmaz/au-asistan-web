import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema/documents";
import { uuidString, parseOrThrow } from "@/lib/validation";

import type { DocumentDTO, SearchResult } from "../types";
import { searchKnowledgeInputSchema } from "./validators";

function toDocumentDTO(row: typeof documents.$inferSelect): DocumentDTO {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.sourceUrl,
    sourceType: row.sourceType as "html" | "pdf",
    domain: row.domain,
    unit: row.unit,
    isWatched: row.isWatched,
    checkFrequency: row.checkFrequency,
    autoIngest: row.autoIngest,
    contentHash: row.contentHash,
    lastScrapedAt: row.lastScrapedAt?.toISOString() ?? null,
    lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getDocuments(): Promise<DocumentDTO[]> {
  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .select()
    .from(documents)
    .orderBy(desc(documents.createdAt));
  return rows.map(toDocumentDTO);
}

export async function getDocumentById(
  id: string
): Promise<DocumentDTO | null> {
  parseOrThrow(uuidString, id, "Invalid document ID");

  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  return result[0] ? toDocumentDTO(result[0]) : null;
}

export async function searchSimilarChunks(
  embedding: number[],
  options: { unit?: string; limit: number }
): Promise<SearchResult[]> {
  parseOrThrow(searchKnowledgeInputSchema.pick({ limit: true }), { limit: options.limit }, "Invalid search options");

  const db = await createDrizzleSupabaseClient();
  const embeddingLiteral = `[${embedding.join(",")}]`;

  const rawSimilarity = sql<number>`(1 - (${documentChunks.embedding} <=> ${embeddingLiteral}::vector))`;
  const boostedSimilarity = options.unit
    ? sql<number>`(1 - (${documentChunks.embedding} <=> ${embeddingLiteral}::vector)) * CASE WHEN ${documents.unit} = ${options.unit} THEN 1.3 ELSE 1.0 END`
    : rawSimilarity;

  const rows = await db.admin
    .select({
      content: documentChunks.content,
      similarity: boostedSimilarity,
      metadata: documentChunks.metadata,
      documentTitle: documents.title,
      sourceUrl: documents.sourceUrl,
      unit: documents.unit,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(sql`${documentChunks.embedding} IS NOT NULL`)
    .orderBy(desc(boostedSimilarity))
    .limit(options.limit);

  return rows.map((row) => ({
    content: row.content,
    similarity: row.similarity,
    documentTitle: row.documentTitle,
    sourceUrl: row.sourceUrl,
    unit: row.unit,
    sectionPath: (row.metadata as Record<string, unknown>)?.sectionPath as
      | string
      | undefined,
  }));
}

export async function searchWithFallback(
  embedding: number[],
  options: { unit?: string; limit: number }
): Promise<SearchResult[]> {
  const results = await searchSimilarChunks(embedding, options);

  const SIMILARITY_THRESHOLD = 0.3;
  const MIN_RESULTS = Math.ceil(options.limit / 2);

  const goodResults = results.filter((r) => r.similarity >= SIMILARITY_THRESHOLD);

  if (options.unit && goodResults.length < MIN_RESULTS) {
    const broadResults = await searchSimilarChunks(embedding, {
      limit: options.limit,
    });
    const seen = new Set(results.map((r) => r.content));
    const extra = broadResults.filter((r) => !seen.has(r.content));
    return [...goodResults, ...extra].slice(0, options.limit);
  }

  return results;
}

export async function getWatchedDocuments() {
  const db = await createDrizzleSupabaseClient();
  return db.admin
    .select()
    .from(documents)
    .where(eq(documents.isWatched, true));
}
