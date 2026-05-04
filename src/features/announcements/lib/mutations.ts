import "server-only";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { announcements } from "@/lib/db/schema/content";
import { logger } from "@/lib/logger";
import type { SelectAnnouncement } from "@/lib/db/schema/content";
import type { ParsedAnnouncement } from "../types";

const BATCH_SIZE = 500;

export async function upsertAnnouncements(
  parsed: ParsedAnnouncement[],
): Promise<SelectAnnouncement[]> {
  if (parsed.length === 0) return [];

  const seen = new Map<string, ParsedAnnouncement>();
  for (const a of parsed) {
    if (!seen.has(a.sourceUrl)) seen.set(a.sourceUrl, a);
  }
  const unique = Array.from(seen.values());

  const db = await createDrizzleSupabaseClient();
  const inserted: SelectAnnouncement[] = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const values = batch.map((a) => ({
      title: a.title,
      sourceUrl: a.sourceUrl,
      category: a.category,
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
    }));

    const rows = await db.admin
      .insert(announcements)
      .values(values)
      .onConflictDoNothing({ target: announcements.sourceUrl })
      .returning();

    inserted.push(...rows);
  }

  logger.info(
    `Upserted ${unique.length} announcements: ${inserted.length} new, ${unique.length - inserted.length} existing`,
  );

  return inserted;
}
