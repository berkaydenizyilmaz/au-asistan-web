import { getTranslations } from "next-intl/server";

import type { AnnouncementDTO } from "../types";
import { AnnouncementCard } from "./announcement-card";

interface AnnouncementListProps {
  announcements: AnnouncementDTO[];
}

export async function AnnouncementList({ announcements }: AnnouncementListProps) {
  const t = await getTranslations("announcements");

  if (announcements.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t("noAnnouncements")}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {announcements.map((a) => (
        <AnnouncementCard key={a.id} announcement={a} />
      ))}
    </div>
  );
}
