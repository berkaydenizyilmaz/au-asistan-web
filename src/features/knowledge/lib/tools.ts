import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { generateEmbedding } from "./embedder";
import { searchWithFallback } from "./queries";

export const knowledgeTools = {
  searchKnowledge: tool({
    description:
      "Üniversite bilgi tabanında arama yapar. Yönetmelikler, kılavuzlar, birim bilgileri, iletişim bilgileri, staj, kayıt, harç, yatay geçiş gibi statik üniversite bilgilerini bulmak için kullan. Sorgu ile ilgili birim biliniyorsa unit parametresini de gönder.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Aranacak bilgi. Kullanıcının sorusunu veya ilgili anahtar kelimeleri içermeli.",
        ),
      unit: z
        .string()
        .optional()
        .describe(
          "Bilginin ait olduğu birim (örn: 'Mühendislik Fakültesi', 'Öğrenci İşleri'). Bilinmiyorsa boş bırak.",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .default(5)
        .describe("Döndürülecek maksimum sonuç sayısı. Varsayılan 5."),
    }),
    execute: async ({ query, unit, limit }) => {
      try {
        const embedding = await generateEmbedding(query);
        const results = await searchWithFallback(embedding, {
          unit,
          limit: limit ?? 5,
        });

        if (results.length === 0) {
          return {
            found: false,
            message: "Bilgi tabanında ilgili içerik bulunamadı.",
          };
        }

        return {
          found: true,
          results: results.map((r) => ({
            content: r.content,
            documentTitle: r.documentTitle,
            sourceUrl: r.sourceUrl,
            unit: r.unit,
            sectionPath: r.sectionPath,
            similarity: Math.round(r.similarity * 100) / 100,
          })),
        };
      } catch {
        return {
          error: true,
          message: "Bilgi tabanı aranırken bir hata oluştu.",
        };
      }
    },
  }),
};
