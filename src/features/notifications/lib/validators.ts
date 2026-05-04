import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  announcements: z.boolean(),
  events: z.boolean(),
  calendar: z.boolean(),
  calendarLeadDays: z
    .array(z.number().int().min(0).max(7))
    .max(4)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "Lead days must be unique",
    }),
});

export const subscriptionInputSchema = z.object({
  type: z.enum(["announcement", "event"]),
  category: z.string().min(1).max(120),
});

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
