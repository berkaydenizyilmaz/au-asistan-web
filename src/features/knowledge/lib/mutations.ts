import "server-only";

import { eq, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema/documents";
import { requireAdmin } from "@/lib/auth/server";
import { uuidString, parseOrThrow } from "@/lib/validation";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { updateWatchSettingsSchema, bulkCreateDocumentsSchema, updateDocumentMetadataSchema } from "./validators";

import { scrapeUrl } from "./scraper";
import { chunkContent } from "./chunker";
import { generateEmbeddings } from "./embedder";
import { logger } from "@/lib/logger";

export async function bulkCreateDocumentStubs(
  params: unknown,
): Promise<{ saved: number; updated: number }> {
  await requireAdmin();
  const { documents: stubs } = parseOrThrow(bulkCreateDocumentsSchema, params, "Invalid bulk create input");

  const db = await createDrizzleSupabaseClient();

  const values = stubs.map((stub) => {
    const parsed = new URL(stub.url);
    const sourceType = stub.url.toLowerCase().endsWith(".pdf") ? "pdf" : "html";
    return {
      title: stub.title,
      sourceUrl: stub.url,
      sourceType,
      domain: parsed.hostname,
      unit: stub.unit ?? null,
      metadata: {},
    };
  });

  // xmax = 0 means the row was newly inserted (not updated)
  const rows = await db.admin
    .insert(documents)
    .values(values)
    .onConflictDoUpdate({
      target: documents.sourceUrl,
      set: {
        title: sql`excluded.title`,
        unit: sql`excluded.unit`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: documents.id, xmax: sql<string>`xmax` });

  const saved = rows.filter((r) => r.xmax === "0").length;
  const updated = rows.length - saved;

  logger.info(`[bulkCreate] ${saved} inserted, ${updated} updated`);
  return { saved, updated };
}

interface IngestParams {
  url: string;
  title?: string | null;
  unit?: string | null;
}

const BATCH_SIZE = 50;

export async function ingestDocument(params: IngestParams): Promise<string> {
  await requireAdmin();
  logger.info(`[ingest] start — ${params.url}`);

  logger.info(`[ingest] scraping...`);
  const scraped = await scrapeUrl(params.url);
  logger.info(`[ingest] scraped — ${scraped.text.length} chars, type=${scraped.sourceType}`);

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

  logger.info(`[ingest] chunking...`);
  const chunks = await chunkContent(scraped);
  logger.info(`[ingest] ${chunks.length} chunks — embedding...`);

  const embeddings = await generateEmbeddings(chunks.map((c) => c.content));
  logger.info(`[ingest] embeddings done — saving to DB...`);

  const docId = await db.admin.transaction(async (tx) => {
    const [doc] = await tx
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

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);
      await tx.insert(documentChunks).values(
        batch.map((chunk, j) => ({
          documentId: doc.id,
          content: chunk.content,
          embedding: batchEmbeddings[j],
          metadata: chunk.metadata,
        })),
      );
    }

    return doc.id;
  });

  logger.info(`[ingest] done — id=${docId}`);
  return docId;
}

export async function reingestDocument(id: string): Promise<void> {
  await requireAdmin();
  parseOrThrow(uuidString, id, "Invalid document ID");

  const db = await createDrizzleSupabaseClient();

  const [doc] = await db.admin
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!doc) throw new NotFoundError("Döküman bulunamadı");

  const scraped = await scrapeUrl(doc.sourceUrl);
  const chunks = await chunkContent(scraped);
  const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

  await db.admin.transaction(async (tx) => {
    await tx.delete(documentChunks).where(eq(documentChunks.documentId, id));

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);
      await tx.insert(documentChunks).values(
        batch.map((chunk, j) => ({
          documentId: id,
          content: chunk.content,
          embedding: batchEmbeddings[j],
          metadata: chunk.metadata,
        })),
      );
    }

    await tx
      .update(documents)
      .set({ contentHash: scraped.contentHash, lastScrapedAt: new Date(), updatedAt: new Date() })
      .where(eq(documents.id, id));
  });
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

export async function updateDocumentMetadata(id: string, params: unknown): Promise<void> {
  await requireAdmin();
  parseOrThrow(uuidString, id, "Invalid document ID");
  const data = parseOrThrow(updateDocumentMetadataSchema, params, "Invalid metadata");

  const db = await createDrizzleSupabaseClient();

  const result = await db.admin
    .update(documents)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.unit !== undefined && { unit: data.unit }),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning({ id: documents.id });

  if (!result[0]) throw new NotFoundError("Döküman bulunamadı");
}

export async function updateDocumentWatchSettings(
  id: string,
  params: unknown
): Promise<void> {
  await requireAdmin();
  parseOrThrow(uuidString, id, "Invalid document ID");
  const data = parseOrThrow(updateWatchSettingsSchema, params, "Invalid watch settings");

  const db = await createDrizzleSupabaseClient();

  const result = await db.admin
    .update(documents)
    .set({
      isWatched: data.isWatched,
      checkFrequency: data.checkFrequency ?? null,
      autoIngest: data.autoIngest ?? false,
      updatedAt: new Date(),
    })
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
          const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

          await db.admin.transaction(async (tx) => {
            await tx.delete(documentChunks).where(eq(documentChunks.documentId, doc.id));

            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
              const batch = chunks.slice(i, i + BATCH_SIZE);
              const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);
              await tx.insert(documentChunks).values(
                batch.map((chunk, j) => ({
                  documentId: doc.id,
                  content: chunk.content,
                  embedding: batchEmbeddings[j],
                  metadata: chunk.metadata,
                })),
              );
            }

            await tx
              .update(documents)
              .set({
                contentHash: scraped.contentHash,
                lastScrapedAt: new Date(),
                lastCheckedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(documents.id, doc.id));
          });

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
    } catch (error) {
      logger.warn(`[checkWatched] failed for ${doc.sourceUrl}`, error);
    }
  }

  return { checked, reingested };
}
