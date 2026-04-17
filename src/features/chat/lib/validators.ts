import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { conversations, messages } from "@/lib/db/schema/chat";

export const insertConversationSchema = createInsertSchema(conversations, {
  title: (schema) => schema.max(200).nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertMessageSchema = createInsertSchema(messages, {
  role: () => z.enum(["user", "assistant"]),
}).omit({ id: true, createdAt: true });

export const updateConversationTitleSchema = z.object({
  title: z.string().min(1).max(200),
});

export const messageFeedbackInputSchema = z.object({
  rating: z.enum(["like", "dislike"]),
});
