import "server-only";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { announcements } from "@/lib/db/schema/content";
import { logger } from "@/lib/logger";
import type { ParsedAnnouncement } from "../types";

const BATCH_SIZE = 500;

export async function upsertAnnouncements(
  parsed: ParsedAnnouncement[],
): Promise<void> {
  if (parsed.length === 0) return;

  const seen = new Map<string, ParsedAnnouncement>();
  for (const a of parsed) {
    if (!seen.has(a.sourceUrl)) seen.set(a.sourceUrl, a);
  }
  const unique = Array.from(seen.values());

  const db = await createDrizzleSupabaseClient();

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const values = batch.map((a) => ({
      title: a.title,
      sourceUrl: a.sourceUrl,
      category: a.category,
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
    }));

    await db.admin
      .insert(announcements)
      .values(values)
      .onConflictDoNothing({ target: announcements.sourceUrl });
  }

  logger.info(
    `Upserted ${unique.length} announcements (${parsed.length - unique.length} duplicates skipped)`,
  );
}
