import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const cronRuns = pgTable("cron_runs", {
  id: uuid().primaryKey().defaultRandom(),
  job: text().notNull(),
  status: text().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
  durationMs: integer("duration_ms").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  errorMessage: text("error_message"),
  triggeredBy: text("triggered_by").notNull(),
});

export type SelectCronRun = typeof cronRuns.$inferSelect;
export type InsertCronRun = typeof cronRuns.$inferInsert;
