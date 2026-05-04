import "server-only";

import { and, eq } from "drizzle-orm";

import { requireUserId } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { notifications } from "@/lib/db/schema/notifications";
import {
  users,
  userSubscriptions,
  type NotificationPreferences,
} from "@/lib/db/schema/users";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import type { SubscriptionDTO } from "../types";
import { notificationPreferencesSchema, subscriptionInputSchema } from "./validators";
import type { SubscriptionInput } from "./validators";

export async function markAsRead(notificationId: string): Promise<void> {
  const userId = await requireUserId();
  const db = await createDrizzleSupabaseClient();

  const updated = await db.rls((tx) =>
    tx
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning({ id: notifications.id }),
  );

  if (updated.length === 0) throw new NotFoundError("Notification not found");
}

export async function markAllAsRead(): Promise<{ count: number }> {
  const userId = await requireUserId();
  const db = await createDrizzleSupabaseClient();

  const updated = await db.rls((tx) =>
    tx
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .returning({ id: notifications.id }),
  );

  return { count: updated.length };
}

export async function updatePreferences(
  prefs: unknown,
): Promise<void> {
  const userId = await requireUserId();
  const parsed = parseOrThrow(
    notificationPreferencesSchema,
    prefs,
    "Invalid notification preferences",
  ) satisfies NotificationPreferences;

  const db = await createDrizzleSupabaseClient();

  await db.rls((tx) =>
    tx
      .update(users)
      .set({ notificationPreferences: parsed, updatedAt: new Date() })
      .where(eq(users.id, userId)),
  );
}

export async function addSubscription(input: unknown): Promise<SubscriptionDTO> {
  const userId = await requireUserId();
  const parsed = parseOrThrow(
    subscriptionInputSchema,
    input,
    "Invalid subscription input",
  ) satisfies SubscriptionInput;

  const db = await createDrizzleSupabaseClient();

  const existing = await db.rls((tx) =>
    tx
      .select({ id: userSubscriptions.id })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.type, parsed.type),
          eq(userSubscriptions.category, parsed.category),
        ),
      )
      .limit(1),
  );

  if (existing.length > 0) {
    throw new ConflictError("Already subscribed to this category");
  }

  const [row] = await db.rls((tx) =>
    tx
      .insert(userSubscriptions)
      .values({ userId, type: parsed.type, category: parsed.category })
      .returning(),
  );

  return {
    id: row.id,
    type: row.type as SubscriptionDTO["type"],
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function removeSubscription(subscriptionId: string): Promise<void> {
  const userId = await requireUserId();
  const db = await createDrizzleSupabaseClient();

  const deleted = await db.rls((tx) =>
    tx
      .delete(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.id, subscriptionId),
          eq(userSubscriptions.userId, userId),
        ),
      )
      .returning({ id: userSubscriptions.id }),
  );

  if (deleted.length === 0) throw new NotFoundError("Subscription not found");
}
