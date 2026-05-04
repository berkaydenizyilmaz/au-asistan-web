import {
  foreignKey,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

export interface NotificationPreferences {
  announcements: boolean;
  events: boolean;
  calendar: boolean;
  calendarLeadDays: number[];
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  announcements: true,
  events: true,
  calendar: true,
  calendarLeadDays: [3, 0],
};

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().notNull(),
    name: text().notNull(),
    role: text().notNull().default("user"),
    notificationPreferences: jsonb("notification_preferences")
      .$type<NotificationPreferences>()
      .notNull()
      .default(DEFAULT_NOTIFICATION_PREFERENCES),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: "users_id_fk",
    }).onDelete("cascade"),
    pgPolicy("users can read own data", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
    }),
    pgPolicy("users can update own data", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
  ]
);

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    token: text().notNull(),
    deviceName: text("device_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "push_tokens_user_id_fk",
    }).onDelete("cascade"),
    unique("push_tokens_token_unique").on(table.token),
    pgPolicy("users can manage own push tokens", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ]
);

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: text().notNull(),
    category: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_subscriptions_user_id_fk",
    }).onDelete("cascade"),
    unique("user_subscriptions_user_type_category_unique").on(
      table.userId,
      table.type,
      table.category
    ),
    index("user_subscriptions_type_category_idx").on(table.type, table.category),
    pgPolicy("users can manage own subscriptions", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ]
);

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectPushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
export type SelectUserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
