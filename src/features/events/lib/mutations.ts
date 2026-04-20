import "server-only";

import { sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { events } from "@/lib/db/schema/content";
import { logger } from "@/lib/logger";
import type { ParsedEvent } from "../types";

const BATCH_SIZE = 500;

export async function upsertEvents(parsed: ParsedEvent[]): Promise<void> {
  if (parsed.length === 0) return;

  const seen = new Map<string, ParsedEvent>();
  for (const e of parsed) {
    const key = `${e.title}|${e.eventDate}`;
    if (!seen.has(key)) seen.set(key, e);
  }
  const unique = Array.from(seen.values());

  const db = await createDrizzleSupabaseClient();

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

    await db.admin
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
      });
  }

  logger.info(`Upserted ${unique.length} events (${parsed.length - unique.length} duplicates skipped)`);
}
