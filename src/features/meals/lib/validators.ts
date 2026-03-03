import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { meals, mealRatings } from "@/lib/db/schema/content";

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");

export const uuidString = z.string().uuid("Invalid ID format");

export const insertMealSchema = createInsertSchema(meals, {
  date: (schema) => schema.regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
}).omit({ id: true, createdAt: true });

export const insertMealRatingSchema = createInsertSchema(mealRatings, {
  rating: () => z.enum(["like", "dislike"]),
}).omit({ id: true, createdAt: true });

export const dateRangeSchema = z
  .object({ from: dateString, to: dateString })
  .refine((d) => d.from <= d.to, {
    message: "from must be <= to",
    path: ["from"],
  });

export const mealRatingInputSchema = z.object({
  rating: z.enum(["like", "dislike"]),
});

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}
