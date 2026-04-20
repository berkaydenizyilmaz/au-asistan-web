import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { getRecentAnnouncements } from "./queries";

export const announcementTools = {
  getRecentAnnouncements: tool({
    description:
      "Son üniversite duyurularını getirir. Kullanıcı duyuruları, haberleri, güncel gelişmeleri veya belirli bir birimin duyurularını sorduğunda kullan.",
    inputSchema: z.object({
      category: z
        .string()
        .optional()
        .describe(
          "Birim veya fakülte adı (örn: 'Mühendislik Fakültesi', 'Genel'). Belirtilmezse tüm birimlerden duyurular döner.",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(5)
        .describe("Kaç duyuru getirileceği. Varsayılan: 5"),
    }),
    execute: async ({ category, limit }) => {
      try {
        const results = await getRecentAnnouncements(limit, category);
        if (results.length === 0) {
          return {
            found: false,
            message: category
              ? `${category} birimine ait duyuru bulunamadı.`
              : "Henüz duyuru bulunmuyor.",
          };
        }
        return {
          found: true,
          announcements: results.map((a) => ({
            title: a.title,
            category: a.category,
            sourceUrl: a.sourceUrl,
            publishedAt: a.publishedAt,
          })),
        };
      } catch {
        return {
          error: true,
          message: "Duyurular alınırken bir hata oluştu.",
        };
      }
    },
  }),
};
