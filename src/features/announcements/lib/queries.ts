import "server-only";

import { desc, eq } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { announcements } from "@/lib/db/schema/content";
import { parseOrThrow } from "@/lib/validation";
import type { AnnouncementDTO } from "../types";
import { announcementQuerySchema } from "./validators";

function toAnnouncementDTO(row: {
  id: string;
  title: string;
  category: string;
  sourceUrl: string;
  publishedAt: Date | null;
  createdAt: Date;
}): AnnouncementDTO {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    sourceUrl: row.sourceUrl,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getRecentAnnouncements(
  limit = 20,
  category?: string,
): Promise<AnnouncementDTO[]> {
  const parsed = parseOrThrow(
    announcementQuerySchema,
    { limit, category },
    "Invalid query params",
  );

  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .select()
    .from(announcements)
    .where(parsed.category ? eq(announcements.category, parsed.category) : undefined)
    .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt))
    .limit(parsed.limit);

  return rows.map(toAnnouncementDTO);
}

export async function getAnnouncementCategories(): Promise<string[]> {
  const db = await createDrizzleSupabaseClient();
  const rows = await db.admin
    .selectDistinct({ category: announcements.category })
    .from(announcements)
    .orderBy(announcements.category);

  return rows.map((r) => r.category);
}
