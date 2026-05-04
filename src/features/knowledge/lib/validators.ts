import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { documents } from "@/lib/db/schema/documents";

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ingestUrlSchema = z.object({
  url: z.string().url(),
  unit: z.string().optional(),
  title: z.string().optional(),
});

export const crawlInputSchema = z.object({
  rootUrl: z.string().url(),
  maxDepth: z.number().int().min(1).max(5).default(3),
  maxPages: z.number().int().min(1).max(500).default(100),
});

export const searchKnowledgeInputSchema = z.object({
  query: z.string().min(1),
  unit: z.string().optional(),
  limit: z.number().int().min(1).max(20).default(8),
});

export const reingestSchema = z.object({
  id: z.string().uuid(),
});

export const updateWatchSettingsSchema = z.object({
  isWatched: z.boolean(),
  checkFrequency: z.enum(["daily", "weekly", "monthly"]).nullable().optional(),
  autoIngest: z.boolean().optional(),
});
