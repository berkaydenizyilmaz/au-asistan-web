import { z } from "zod";

export const eventQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
