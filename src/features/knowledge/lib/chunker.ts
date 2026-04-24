import "server-only";

import { generateObject } from "ai";
import { z } from "zod";

import { getChatModel } from "@/lib/ai/provider";
import { AppError } from "@/lib/errors";

import type { ScrapedContent, ChunkWithContext } from "../types";

const chunkSchema = z.object({
  chunks: z.array(
    z.object({
      content: z.string(),
      sectionPath: z.string().optional(),
    })
  ),
});

export async function chunkContent(
  scraped: ScrapedContent
): Promise<ChunkWithContext[]> {
  // Çok uzun metinleri parçala (model context limiti)
  const MAX_INPUT_LENGTH = 12000;
  const text =
    scraped.text.length > MAX_INPUT_LENGTH
      ? scraped.text.slice(0, MAX_INPUT_LENGTH)
      : scraped.text;

  try {
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
        chunkIndex: index,
      },
    }));
  } catch {
    throw new AppError({ code: "CHUNK_FAILED", message: "İçerik chunk'lanamadı", statusCode: 500 });
  }
}
