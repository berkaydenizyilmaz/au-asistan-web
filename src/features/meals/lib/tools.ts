import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { getMealByDate, getMealsByDateRange } from "./queries";

export const mealTools = {
  getMealByDate: tool({
    description:
      "Belirli bir tarihteki yemekhane yemek listesini getirir. Kullanıcı tek bir günün yemeğini sorduğunda kullan (örn: 'bugün yemekte ne var?', 'yarın ne yemek var?'). Tarih YYYY-MM-DD formatında olmalıdır.",
    inputSchema: z.object({
      date: z
        .string()
        .describe(
          "Yemek tarihi YYYY-MM-DD formatında. 'Bugün' için güncel tarihi kullan.",
        ),
    }),
    execute: async ({ date }) => {
      try {
        const meal = await getMealByDate(date);
        if (!meal) {
          return { found: false, message: `${date} tarihine ait yemek verisi bulunamadı.` };
        }
        return { found: true, date: meal.date, items: meal.items, calories: meal.calories };
      } catch {
        return { error: true, message: "Yemek verisi alınırken bir hata oluştu. Tarih formatı geçersiz olabilir." };
      }
    },
  }),

  getMealsByDateRange: tool({
    description:
      "Belirli bir tarih aralığındaki yemekhane yemek listesini getirir. Kullanıcı birden fazla günün yemeğini sorduğunda kullan (örn: 'bu haftanın yemek listesi', 'gelecek hafta ne var?'). Her iki tarih de YYYY-MM-DD formatında olmalıdır.",
    inputSchema: z.object({
      from: z.string().describe("Başlangıç tarihi YYYY-MM-DD formatında."),
      to: z.string().describe("Bitiş tarihi YYYY-MM-DD formatında."),
    }),
    execute: async ({ from, to }) => {
      try {
        const meals = await getMealsByDateRange(from, to);
        if (meals.length === 0) {
          return { found: false, message: `${from} - ${to} tarihleri arasında yemek verisi bulunamadı.` };
        }
        return {
          found: true,
          meals: meals.map((m) => ({ date: m.date, items: m.items, calories: m.calories })),
        };
      } catch {
        return { error: true, message: "Yemek verisi alınırken bir hata oluştu. Tarih formatı geçersiz olabilir." };
      }
    },
  }),
};
