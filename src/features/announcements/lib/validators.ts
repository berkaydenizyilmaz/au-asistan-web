import { z } from "zod";

export const announcementQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
