import "server-only";

import { eq } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema/documents";
import { requireAdmin } from "@/lib/auth/server";
import { uuidString, parseOrThrow } from "@/lib/validation";
import { NotFoundError, ConflictError } from "@/lib/errors";

import { scrapeUrl } from "./scraper";
import { chunkContent } from "./chunker";
import { generateEmbeddings } from "./embedder";
import type { ChunkWithContext } from "../types";

interface IngestParams {
  url: string;
  title?: string | null;
  unit?: string | null;
}

export async function ingestDocument(params: IngestParams): Promise<string> {
  await requireAdmin();

  const scraped = await scrapeUrl(params.url);
  const domain = new URL(params.url).hostname;

  const db = await createDrizzleSupabaseClient();

  const existing = await db.admin
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.sourceUrl, params.url))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError("Bu URL zaten bilgi tabanında mevcut");
  }

  const chunks = await chunkContent(scraped);
  const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

  const [doc] = await db.admin
    .insert(documents)
    .values({
      title: params.title || scraped.title,
      sourceUrl: params.url,
      sourceType: scraped.sourceType,
      domain,
      unit: params.unit ?? null,
      contentHash: scraped.contentHash,
      lastScrapedAt: new Date(),
      metadata: {},
    })
    .returning({ id: documents.id });

  await insertChunks(db, doc.id, chunks, embeddings);

  return doc.id;
}

export async function reingestDocument(id: string): Promise<void> {
  await requireAdmin();
  parseOrThrow(uuidString, id, "Invalid document ID");

  const db = await createDrizzleSupabaseClient();

  const result = await db.admin
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!result[0]) throw new NotFoundError("Döküman bulunamadı");

  const doc = result[0];
  const scraped = await scrapeUrl(doc.sourceUrl);

  const chunks = await chunkContent(scraped);
  const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

  await db.admin
    .delete(documentChunks)
    .where(eq(documentChunks.documentId, id));

  await insertChunks(db, id, chunks, embeddings);

  await db.admin
    .update(documents)
    .set({
      contentHash: scraped.contentHash,
      lastScrapedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id));
}

export async function deleteDocument(id: string): Promise<void> {
  await requireAdmin();
  parseOrThrow(uuidString, id, "Invalid document ID");

  const db = await createDrizzleSupabaseClient();

  const result = await db.admin
    .delete(documents)
    .where(eq(documents.id, id))
    .returning({ id: documents.id });

  if (!result[0]) throw new NotFoundError("Döküman bulunamadı");
}

const FREQUENCY_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

function isDue(doc: { lastCheckedAt: Date | null; checkFrequency: string | null }): boolean {
  if (!doc.checkFrequency) return true;
  if (!doc.lastCheckedAt) return true;
  const interval = FREQUENCY_MS[doc.checkFrequency];
  if (!interval) return true;
  return Date.now() - doc.lastCheckedAt.getTime() >= interval;
}

export async function checkWatchedDocuments(): Promise<{
  checked: number;
  reingested: number;
}> {
  const db = await createDrizzleSupabaseClient();

  const watched = await db.admin
    .select()
    .from(documents)
    .where(eq(documents.isWatched, true));

  let checked = 0;
  let reingested = 0;

  for (const doc of watched) {
    if (!isDue(doc)) continue;

    try {
      const scraped = await scrapeUrl(doc.sourceUrl);
      checked++;

      if (scraped.contentHash !== doc.contentHash) {
        if (doc.autoIngest) {
          const chunks = await chunkContent(scraped);
          const embeddings = await generateEmbeddings(
            chunks.map((c) => c.content)
          );

          await db.admin
            .delete(documentChunks)
            .where(eq(documentChunks.documentId, doc.id));

          await insertChunks(db, doc.id, chunks, embeddings);

          await db.admin
            .update(documents)
            .set({
              contentHash: scraped.contentHash,
              lastScrapedAt: new Date(),
              lastCheckedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(documents.id, doc.id));

          reingested++;
        } else {
          await db.admin
            .update(documents)
            .set({ lastCheckedAt: new Date() })
            .where(eq(documents.id, doc.id));
        }
      } else {
        await db.admin
          .update(documents)
          .set({ lastCheckedAt: new Date() })
          .where(eq(documents.id, doc.id));
      }
    } catch {
    }
  }

  return { checked, reingested };
}

async function insertChunks(
  db: Awaited<ReturnType<typeof createDrizzleSupabaseClient>>,
  documentId: string,
  chunks: ChunkWithContext[],
  embeddings: number[][]
): Promise<void> {
  if (chunks.length === 0) return;

  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);

    await db.admin.insert(documentChunks).values(
      batch.map((chunk, j) => ({
        documentId,
        content: chunk.content,
        embedding: batchEmbeddings[j],
        metadata: chunk.metadata,
      }))
    );
  }
}
