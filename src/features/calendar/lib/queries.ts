import "server-only";

import { asc, desc, eq, gte, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { academicCalendar } from "@/lib/db/schema/content";
import { getTodayStr } from "@/lib/date";
import { parseOrThrow } from "@/lib/validation";
import type { CalendarEventDTO } from "../types";
import { academicYearSchema } from "./validators";

function toDTO(row: typeof academicCalendar.$inferSelect): CalendarEventDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    semester: row.semester as CalendarEventDTO["semester"],
    academicYear: row.academicYear,
  };
}

export async function getCalendarEvents(academicYear: string) {
  parseOrThrow(academicYearSchema, academicYear, "Invalid academic year");

  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .select()
    .from(academicCalendar)
    .where(eq(academicCalendar.academicYear, academicYear))
    .orderBy(asc(academicCalendar.sortOrder));

  return rows.map(toDTO);
}

export async function getActiveAcademicYear(): Promise<string | null> {
  const db = await createDrizzleSupabaseClient();

  // Find the most recent academic year by looking at the latest event
  const latest = await db.admin
    .select({
      academicYear: academicCalendar.academicYear,
      maxEndDate: sql<string>`max(coalesce(${academicCalendar.endDate}, ${academicCalendar.startDate}))`,
    })
    .from(academicCalendar)
    .groupBy(academicCalendar.academicYear)
    .orderBy(desc(sql`max(coalesce(${academicCalendar.endDate}, ${academicCalendar.startDate}))`))
    .limit(1);

  if (latest.length === 0) return null;

  const { academicYear, maxEndDate } = latest[0];

  // Check if the academic year is still active (last event + 7 days grace)
  const lastDate = new Date(maxEndDate);
  lastDate.setDate(lastDate.getDate() + 7);
  const graceStr = lastDate.toISOString().split("T")[0];

  const today = getTodayStr();
  if (today > graceStr) return null;

  return academicYear;
}

export async function getUpcomingEvents(limit = 5) {
  const db = await createDrizzleSupabaseClient();
  const today = getTodayStr();

  const rows = await db.admin
    .select()
    .from(academicCalendar)
    .where(gte(sql`coalesce(${academicCalendar.endDate}, ${academicCalendar.startDate})`, today))
    .orderBy(asc(academicCalendar.startDate))
    .limit(limit);

  return rows.map(toDTO);
}
