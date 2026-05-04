import "server-only";

import { generateObject } from "ai";
import { z } from "zod";

import { getChatModel } from "@/lib/ai/provider";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import type { ScrapedContent, ChunkWithContext } from "../types";

const chunkSchema = z.object({
  chunks: z.array(
    z.object({
      content: z.string(),
      sectionPath: z.string().optional(),
    })
  ),
});

const MAX_SEGMENT_LENGTH = 12000;

async function chunkSegment(
  scraped: ScrapedContent,
  text: string,
  indexOffset: number
): Promise<ChunkWithContext[]> {
  const { object } = await generateObject({
    model: getChatModel(),
    schema: chunkSchema,
    prompt: `Aşağıdaki metni anlamlı paragraflara böl. Her parça:
- Kendi başına anlamlı bir bilgi birimi olsun
- 150-300 kelime arasında olsun
- Başka bir sayfada bağımsız okunduğunda anlaşılır olsun
- Varsa bölüm başlığını "sectionPath" alanına yaz (örn: "Staj > Başvuru Koşulları")

Kaynak başlığı: ${scraped.title}
Kaynak URL: ${scraped.url}

Metin:
${text}`,
  });

  return object.chunks.map((chunk, index) => ({
    content: chunk.content,
    metadata: {
      documentTitle: scraped.title,
      sectionPath: chunk.sectionPath,
      chunkIndex: indexOffset + index,
    },
  }));
}

export async function chunkContent(
  scraped: ScrapedContent
): Promise<ChunkWithContext[]> {
  const { text } = scraped;

  if (text.length <= MAX_SEGMENT_LENGTH) {
    try {
      return await chunkSegment(scraped, text, 0);
    } catch {
      throw new AppError({ code: "CHUNK_FAILED", message: "İçerik chunk'lanamadı", statusCode: 500 });
    }
  }

  const segmentCount = Math.ceil(text.length / MAX_SEGMENT_LENGTH);
  logger.info(`[chunker] long content (${text.length} chars, ${segmentCount} segments) — ${scraped.url}`);

  const allChunks: ChunkWithContext[] = [];

  for (let offset = 0; offset < text.length; offset += MAX_SEGMENT_LENGTH) {
    const segment = text.slice(offset, offset + MAX_SEGMENT_LENGTH);
    try {
      const segmentChunks = await chunkSegment(scraped, segment, allChunks.length);
      allChunks.push(...segmentChunks);
    } catch {
      logger.warn(`[chunker] segment at offset ${offset} failed, skipping`);
    }
  }

  if (allChunks.length === 0) {
    throw new AppError({ code: "CHUNK_FAILED", message: "İçerik chunk'lanamadı", statusCode: 500 });
  }

  logger.info(`[chunker] done — ${allChunks.length} chunks total`);
  return allChunks;
}
