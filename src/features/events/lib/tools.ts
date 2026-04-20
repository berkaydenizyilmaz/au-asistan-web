import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { getEventsForAI } from "./queries";

export const eventTools = {
  getUpcomingEvents: tool({
    description:
      "Bugün ve önümüzdeki 30 gün içindeki üniversite etkinliklerini getirir. Kullanıcı etkinlikleri, konserleri, konferansları, seminerleri, spor etkinliklerini veya sosyal aktiviteleri sorduğunda kullan. Kategori, tarih veya konu bazlı filtrelemeyi kendin yap.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const results = await getEventsForAI();
        if (results.length === 0) {
          return {
            found: false,
            message: "Önümüzdeki 30 gün içinde etkinlik bulunmuyor.",
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
