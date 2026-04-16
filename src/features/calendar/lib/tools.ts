import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { getActiveAcademicYear, getCalendarEvents, getUpcomingEvents } from "./queries";

export const calendarTools = {
  getUpcomingCalendarEvents: tool({
    description:
      "Yaklaşan akademik takvim etkinliklerini getirir. Kullanıcı yaklaşan etkinlikleri, son tarihleri veya ne olduğunu sorduğunda kullan (örn: 'yaklaşan akademik etkinlikler neler?', 'bu ay ne var?').",
    inputSchema: z.object({
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe("Döndürülecek maksimum etkinlik sayısı."),
    }),
    execute: async ({ limit }) => {
      try {
        const events = await getUpcomingEvents(limit);
        if (events.length === 0) {
          return { found: false, message: "Yaklaşan akademik takvim etkinliği bulunamadı." };
        }
        return {
          found: true,
          events: events.map((e) => ({
            title: e.title,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
            semester: e.semester,
            academicYear: e.academicYear,
          })),
        };
      } catch {
        return { error: true, message: "Akademik takvim verisi alınırken bir hata oluştu." };
      }
    },
  }),

  getCalendarEventsByYear: tool({
    description:
      "Belirli bir akademik yılın tüm takvim etkinliklerini getirir. Kullanıcı belirli bir akademik yılın takvimini sorduğunda kullan (örn: '2025-2026 akademik takvimi'). Akademik yıl belirtilmemişse aktif yılı kullan.",
    inputSchema: z.object({
      academicYear: z
        .string()
        .optional()
        .describe(
          "Akademik yıl YYYY-YYYY formatında (örn: '2025-2026'). Kullanıcı belirtmemişse atlayabilirsin, aktif akademik yıl otomatik kullanılır.",
        ),
    }),
    execute: async ({ academicYear }) => {
      try {
        let year = academicYear?.trim();

        if (!year || !/^\d{4}-\d{4}$/.test(year)) {
          const activeYear = await getActiveAcademicYear();
          if (!activeYear) {
            return { found: false, message: "Aktif akademik yıl bilgisi bulunamadı." };
          }
          year = activeYear;
        }

        const events = await getCalendarEvents(year);
        if (events.length === 0) {
          return { found: false, message: `${year} akademik yılına ait takvim verisi bulunamadı.` };
        }

        return {
          found: true,
          academicYear: year,
          events: events.map((e) => ({
            title: e.title,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
            semester: e.semester,
          })),
        };
      } catch {
        return { error: true, message: "Akademik takvim verisi alınırken bir hata oluştu." };
      }
    },
  }),
};
