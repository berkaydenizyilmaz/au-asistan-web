import {
  date,
  foreignKey,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import {
  anonRole,
  authenticatedRole,
  authUid,
} from "drizzle-orm/supabase";

import { users } from "./users";

export const announcements = pgTable(
  "announcements",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    content: text().notNull(),
    category: text().notNull(),
    sourceUrl: text("source_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("announcements_source_url_unique").on(table.sourceUrl),
    pgPolicy("anyone can read announcements", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text().notNull(),
    category: text().notNull(),
    sourceUrl: text("source_url").notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }),
    location: text(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("events_source_url_unique").on(table.sourceUrl),
    pgPolicy("anyone can read events", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ]
);

export const meals = pgTable(
  "meals",
  {
    id: uuid().primaryKey().defaultRandom(),
    date: date().notNull(),
    items: jsonb().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("meals_date_unique").on(table.date),
    pgPolicy("anyone can read meals", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ]
);

export const mealRatings = pgTable(
  "meal_ratings",
  {
    id: uuid().primaryKey().defaultRandom(),
    mealId: uuid("meal_id").notNull(),
    userId: uuid("user_id").notNull(),
    rating: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.mealId],
      foreignColumns: [meals.id],
      name: "meal_ratings_meal_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "meal_ratings_user_id_fk",
    }).onDelete("cascade"),
    unique("meal_ratings_meal_user_unique").on(table.mealId, table.userId),
    pgPolicy("users can manage own meal ratings", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("anyone can read meal ratings", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ]
);

export const academicCalendar = pgTable(
  "academic_calendar",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [
    pgPolicy("anyone can read academic calendar", {
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
  ]
);

export type SelectAnnouncement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;
export type SelectEvent = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type SelectMeal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;
export type SelectMealRating = typeof mealRatings.$inferSelect;
export type InsertMealRating = typeof mealRatings.$inferInsert;
export type SelectAcademicCalendar = typeof academicCalendar.$inferSelect;
export type InsertAcademicCalendar = typeof academicCalendar.$inferInsert;
