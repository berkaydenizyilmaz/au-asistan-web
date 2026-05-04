import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import type { SelectAnnouncement, SelectEvent } from "@/lib/db/schema/content";
import { academicCalendar } from "@/lib/db/schema/content";
import { notifications } from "@/lib/db/schema/notifications";
import { users, DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/db/schema/users";
import { APP_TIMEZONE } from "@/lib/date";
import { logger } from "@/lib/logger";

export async function dispatchAnnouncementNotifications(
  inserted: SelectAnnouncement[],
): Promise<{ created: number }> {
  if (inserted.length === 0) return { created: 0 };

  const db = await createDrizzleSupabaseClient();
  let total = 0;

  for (const a of inserted) {
    const recipients = await db.admin
      .select({ id: users.id })
      .from(users)
      .innerJoin(
        sql`user_subscriptions s`,
        sql`s.user_id = ${users.id}
          AND s.type = 'announcement'
          AND s.category = ${a.category}`,
      )
      .where(
        sql`COALESCE((${users.notificationPreferences}->>'announcements')::boolean, true) = true`,
      );

    if (recipients.length === 0) continue;

    // Dedup: skip users who already have a notification for this announcement
    const alreadyNotified = await db.admin
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "announcement"),
          eq(notifications.referenceId, a.id),
        ),
      );

    const notifiedSet = new Set(alreadyNotified.map((r) => r.userId));
    const newRecipients = recipients.filter((r) => !notifiedSet.has(r.id));

    if (newRecipients.length === 0) continue;

    const values = newRecipients.map((r) => ({
      userId: r.id,
      type: "announcement" as const,
      title: `Yeni duyuru: ${a.category}`,
      body: a.title.slice(0, 200),
      referenceId: a.id,
      metadata: {},
    }));

    await db.admin.insert(notifications).values(values);
    total += values.length;
  }

  logger.info(`Dispatched ${total} announcement notifications`);
  return { created: total };
}

export async function dispatchEventNotifications(
  inserted: SelectEvent[],
): Promise<{ created: number }> {
  if (inserted.length === 0) return { created: 0 };

  const db = await createDrizzleSupabaseClient();
  let total = 0;

  for (const e of inserted) {
    const dateStr = typeof e.eventDate === "string" ? e.eventDate : e.eventDate;
    const recipients = await db.admin
      .select({ id: users.id })
      .from(users)
      .innerJoin(
        sql`user_subscriptions s`,
        sql`s.user_id = ${users.id}
          AND s.type = 'event'
          AND s.category = ${e.category}`,
      )
      .where(
        sql`COALESCE((${users.notificationPreferences}->>'events')::boolean, true) = true`,
      );

    if (recipients.length === 0) continue;

    // Dedup: skip users who already have a notification for this event
    const alreadyNotified = await db.admin
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(
        and(
          eq(notifications.type, "event"),
          eq(notifications.referenceId, e.id),
        ),
      );

    const notifiedSet = new Set(alreadyNotified.map((r) => r.userId));
    const newRecipients = recipients.filter((r) => !notifiedSet.has(r.id));

    if (newRecipients.length === 0) continue;

    const values = newRecipients.map((r) => ({
      userId: r.id,
      type: "event" as const,
      title: `Yeni etkinlik: ${e.category}`,
      body: `${e.title} — ${dateStr}`,
      referenceId: e.id,
      metadata: {},
    }));

    await db.admin.insert(notifications).values(values);
    total += values.length;
  }

  logger.info(`Dispatched ${total} event notifications`);
  return { created: total };
}

export async function dispatchCalendarReminders(
  today: Date,
): Promise<{ created: number }> {
  const db = await createDrizzleSupabaseClient();

  const allUsers = await db.admin
    .select({
      id: users.id,
      notificationPreferences: users.notificationPreferences,
    })
    .from(users)
    .where(
      sql`COALESCE((${users.notificationPreferences}->>'calendar')::boolean, true) = true`,
    );

  if (allUsers.length === 0) return { created: 0 };

  let total = 0;
  const todayStr = today
    .toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });

  for (const leadDays of [0, 1, 3, 7]) {
    const usersForLead = allUsers.filter((u) => {
      const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...u.notificationPreferences };
      return (
        Array.isArray(prefs.calendarLeadDays) &&
        prefs.calendarLeadDays.includes(leadDays)
      );
    });

    if (usersForLead.length === 0) continue;

    const targetDate = addDays(todayStr, leadDays);

    const upcomingEvents = await db.admin
      .select()
      .from(academicCalendar)
      .where(eq(academicCalendar.startDate, targetDate));

    if (upcomingEvents.length === 0) continue;

    for (const event of upcomingEvents) {
      for (const user of usersForLead) {
        const alreadyExists = await db.admin
          .select({ id: notifications.id })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, user.id),
              eq(notifications.type, "calendar"),
              eq(notifications.referenceId, event.id),
              sql`${notifications.metadata}->>'lead_days' = ${String(leadDays)}`,
            ),
          )
          .limit(1);

        if (alreadyExists.length > 0) continue;

        const title =
          leadDays === 0
            ? `Bugün: ${event.title}`
            : `${leadDays} gün kaldı: ${event.title}`;
        const body =
          leadDays === 0
            ? event.description ?? `${event.startDate} tarihinde başlıyor`
            : `${event.startDate} tarihinde başlıyor`;

        await db.admin.insert(notifications).values({
          userId: user.id,
          type: "calendar",
          title,
          body,
          referenceId: event.id,
          metadata: { lead_days: leadDays },
        });

        total++;
      }
    }
  }

  logger.info(`Dispatched ${total} calendar reminder notifications`);
  return { created: total };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
