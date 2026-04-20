import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { getUpcomingEvents } from "./queries";

export const eventTools = {
  getUpcomingEvents: tool({
    description:
      "Yaklaşan üniversite etkinliklerini getirir. Kullanıcı etkinlikleri, konserleri, konferansları, seminerleri veya sosyal aktiviteleri sorduğunda kullan.",
    inputSchema: z.object({
      category: z
        .string()
        .optional()
        .describe(
          "Etkinlik kategorisi (örn: 'Konferans', 'Konser', 'Eğitim', 'Gezi'). Belirtilmezse tüm kategorilerden etkinlikler döner.",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(5)
        .describe("Kaç etkinlik getirileceği. Varsayılan: 5"),
    }),
    execute: async ({ category, limit }) => {
      try {
        const results = await getUpcomingEvents(limit, category);
        if (results.length === 0) {
          return {
            found: false,
            message: category
              ? `${category} kategorisinde yaklaşan etkinlik bulunamadı.`
              : "Yaklaşan etkinlik bulunmuyor.",
          };
        }
        return {
          found: true,
          events: results.map((e) => ({
            title: e.title,
            category: e.category,
            organizer: e.organizer,
            location: e.location,
            eventDate: e.eventDate,
            sourceUrl: e.sourceUrl,
          })),
        };
      } catch {
        return {
          error: true,
          message: "Etkinlikler alınırken bir hata oluştu.",
        };
      }
    },
  }),
};
