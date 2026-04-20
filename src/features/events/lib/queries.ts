import "server-only";

import { and, asc, eq, gte } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { events } from "@/lib/db/schema/content";
import { getTodayStr } from "@/lib/date";
import { parseOrThrow } from "@/lib/validation";
import type { EventDTO } from "../types";
import { eventQuerySchema } from "./validators";

function toEventDTO(row: {
  id: string;
  title: string;
  category: string;
  organizer: string | null;
  location: string | null;
  eventDate: string;
  sourceUrl: string | null;
  createdAt: Date;
}): EventDTO {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    organizer: row.organizer,
    location: row.location,
    eventDate: row.eventDate,
    sourceUrl: row.sourceUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getUpcomingEvents(
  limit = 20,
  category?: string,
): Promise<EventDTO[]> {
  const parsed = parseOrThrow(
    eventQuerySchema,
    { limit, category },
    "Invalid query params",
  );

  const today = getTodayStr();
  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .select()
    .from(events)
    .where(
      and(
        gte(events.eventDate, today),
        parsed.category ? eq(events.category, parsed.category) : undefined,
      ),
    )
    .orderBy(asc(events.eventDate))
    .limit(parsed.limit);

  return rows.map(toEventDTO);
}

export async function getEventCategories(): Promise<string[]> {
  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .selectDistinct({ category: events.category })
    .from(events)
    .orderBy(events.category);

  return rows.map((r) => r.category);
}
