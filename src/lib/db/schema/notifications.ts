import {
  boolean,
  foreignKey,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { users } from "./users";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: text().notNull(),
    title: text().notNull(),
    body: text().notNull(),
    referenceId: uuid("reference_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "notifications_user_id_fk",
    }).onDelete("cascade"),
    pgPolicy("users can read own notifications", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("users can update own notifications", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ]
);

export type SelectNotification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
