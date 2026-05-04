import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { requireUserId } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { announcements, events } from "@/lib/db/schema/content";
import { notifications } from "@/lib/db/schema/notifications";
import {
  users,
  userSubscriptions,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/db/schema/users";
import { parseOrThrow } from "@/lib/validation";
import type { NotificationDTO, SubscriptionDTO } from "../types";
import { notificationListQuerySchema } from "./validators";

function toNotificationDTO(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceId: string | null;
  isRead: boolean;
  metadata: { lead_days?: number };
  createdAt: Date;
}): NotificationDTO {
  return {
    id: row.id,
    type: row.type as NotificationDTO["type"],
    title: row.title,
    body: row.body,
    referenceId: row.referenceId,
    isRead: row.isRead,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

function toSubscriptionDTO(row: {
  id: string;
  type: string;
  category: string;
  createdAt: Date;
}): SubscriptionDTO {
  return {
    id: row.id,
    type: row.type as SubscriptionDTO["type"],
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(
  filters: { page?: number; pageSize?: number; unreadOnly?: boolean } = {},
): Promise<{ items: NotificationDTO[]; total: number }> {
  const userId = await requireUserId();
  const parsed = parseOrThrow(notificationListQuerySchema, filters, "Invalid query params");

  const db = await createDrizzleSupabaseClient();

  const where = and(
    eq(notifications.userId, userId),
    parsed.unreadOnly ? eq(notifications.isRead, false) : undefined,
  );

  const [rows, [{ value: total }]] = await Promise.all([
    db.rls((tx) =>
      tx
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(parsed.pageSize)
        .offset((parsed.page - 1) * parsed.pageSize),
    ),
    db.rls((tx) =>
      tx
        .select({ value: count() })
        .from(notifications)
        .where(where),
    ),
  ]);

  return { items: rows.map(toNotificationDTO), total };
}

export async function getUnreadCount(): Promise<number> {
  const userId = await requireUserId();
  const db = await createDrizzleSupabaseClient();

  const [{ value }] = await db.rls((tx) =>
    tx
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
  );

  return value;
}

export async function getRecentForBell(limit = 10): Promise<NotificationDTO[]> {
  const userId = await requireUserId();
  const db = await createDrizzleSupabaseClient();

  const rows = await db.rls((tx) =>
    tx
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
  );

  return rows.map(toNotificationDTO);
}

export async function getPreferences(): Promise<NotificationPreferences> {
  const userId = await requireUserId();
  const db = await createDrizzleSupabaseClient();

  const rows = await db.rls((tx) =>
    tx
      .select({ notificationPreferences: users.notificationPreferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  );

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(rows[0]?.notificationPreferences ?? {}),
  };
}

export async function listSubscriptions(): Promise<SubscriptionDTO[]> {
  const userId = await requireUserId();
  const db = await createDrizzleSupabaseClient();

  const rows = await db.rls((tx) =>
    tx
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(userSubscriptions.type, userSubscriptions.category),
  );

  return rows.map(toSubscriptionDTO);
}

export async function listAnnouncementCategories(): Promise<string[]> {
  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .selectDistinct({ category: announcements.category })
    .from(announcements)
    .orderBy(announcements.category);
  return rows.map((r) => r.category);
}

export async function listEventCategories(): Promise<string[]> {
  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .selectDistinct({ category: events.category })
    .from(events)
    .orderBy(events.category);
  return rows.map((r) => r.category);
}
