import "server-only";

import { eq } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { academicCalendar } from "@/lib/db/schema/content";
import type { ParsedCalendarEvent } from "../types";

export async function replaceCalendarEvents(events: ParsedCalendarEvent[]) {
  if (events.length === 0) return;

  const academicYear = events[0].academicYear;
  const db = await createDrizzleSupabaseClient();

  await db.admin.delete(academicCalendar).where(
    eq(academicCalendar.academicYear, academicYear),
  );

  await db.admin.insert(academicCalendar).values(
    events.map((e) => ({
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate ?? null,
      semester: e.semester,
      academicYear: e.academicYear,
      sortOrder: e.sortOrder,
    })),
  );
}
