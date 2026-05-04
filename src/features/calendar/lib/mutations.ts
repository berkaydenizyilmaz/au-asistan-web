import "server-only";

import { eq, notInArray, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { academicCalendar } from "@/lib/db/schema/content";
import type { SelectAcademicCalendar } from "@/lib/db/schema/content";
import type { ParsedCalendarEvent } from "../types";

export async function replaceCalendarEvents(
  events: ParsedCalendarEvent[],
): Promise<{ added: SelectAcademicCalendar[]; changed: SelectAcademicCalendar[] }> {
  if (events.length === 0) return { added: [], changed: [] };

  const academicYear = events[0].academicYear;
  const db = await createDrizzleSupabaseClient();

  return db.admin.transaction(async (tx) => {
    // UPSERT preserves IDs for unchanged rows so notification referenceIds stay valid.
    // xmax=0 distinguishes new inserts from updates.
    const rows = await tx
      .insert(academicCalendar)
      .values(
        events.map((e) => ({
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate ?? null,
          semester: e.semester,
          academicYear: e.academicYear,
          sortOrder: e.sortOrder,
        })),
      )
      .onConflictDoUpdate({
        target: [
          academicCalendar.academicYear,
          academicCalendar.title,
          academicCalendar.startDate,
        ],
        set: {
          endDate: sql`excluded.end_date`,
          semester: sql`excluded.semester`,
          sortOrder: sql`excluded.sort_order`,
        },
      })
      .returning({
        id: academicCalendar.id,
        title: academicCalendar.title,
        description: academicCalendar.description,
        startDate: academicCalendar.startDate,
        endDate: academicCalendar.endDate,
        semester: academicCalendar.semester,
        academicYear: academicCalendar.academicYear,
        sortOrder: academicCalendar.sortOrder,
        createdAt: academicCalendar.createdAt,
        isNew: sql<boolean>`(xmax = 0)`,
      });

    // Remove stale events that are no longer in the scraped data.
    const upsertedIds = rows.map((r) => r.id);
    await tx
      .delete(academicCalendar)
      .where(
        eq(academicCalendar.academicYear, academicYear) &&
          notInArray(academicCalendar.id, upsertedIds),
      );

    const added: SelectAcademicCalendar[] = [];
    const changed: SelectAcademicCalendar[] = [];

    for (const row of rows) {
      const { isNew, ...event } = row;
      if (isNew) {
        added.push(event);
      } else {
        changed.push(event);
      }
    }

    return { added, changed };
  });
}
