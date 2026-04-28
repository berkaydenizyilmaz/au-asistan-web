import { z } from "zod";

export const adminFeedbackQuerySchema = z.object({
  rating: z.enum(["up", "down"]).optional(),
  onlyFallback: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export type AdminFeedbackQueryInput = z.infer<typeof adminFeedbackQuerySchema>;

export const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const analyticsRangeSchema = z.enum(["7d", "30d", "all"]);

export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;
