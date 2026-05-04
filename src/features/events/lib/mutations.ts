import "server-only";

import { sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { events } from "@/lib/db/schema/content";
import type { SelectEvent } from "@/lib/db/schema/content";
import { logger } from "@/lib/logger";
import type { ParsedEvent } from "../types";

const BATCH_SIZE = 500;

export async function upsertEvents(
  parsed: ParsedEvent[],
): Promise<{ inserted: SelectEvent[]; updated: SelectEvent[] }> {
  if (parsed.length === 0) return { inserted: [], updated: [] };

  const seen = new Map<string, ParsedEvent>();
  for (const e of parsed) {
    const key = `${e.title}|${e.eventDate}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  const unique = Array.from(seen.values());

  const db = await createDrizzleSupabaseClient();
  const inserted: SelectEvent[] = [];
  const updated: SelectEvent[] = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const values = batch.map((e) => ({
      title: e.title,
      category: e.category,
      organizer: e.organizer,
      location: e.location,
      eventDate: e.eventDate,
      sourceUrl: e.sourceUrl,
    }));

    const rows = await db.admin
      .insert(events)
      .values(values)
      .onConflictDoUpdate({
        target: [events.title, events.eventDate],
        set: {
          category: sql`excluded.category`,
          organizer: sql`excluded.organizer`,
          location: sql`excluded.location`,
          sourceUrl: sql`excluded.source_url`,
        },
      })
      .returning({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        organizer: events.organizer,
        sourceUrl: events.sourceUrl,
        eventDate: events.eventDate,
        location: events.location,
        createdAt: events.createdAt,
        isNew: sql<boolean>`(xmax = 0)`,
      });

    for (const row of rows) {
      const { isNew, ...event } = row;
      if (isNew) {
        inserted.push(event);
      } else {
        updated.push(event);
      }
    }
  }

  logger.info(
    `Upserted ${unique.length} events: ${inserted.length} new, ${updated.length} updated`,
  );

  return { inserted, updated };
}
