import { useTranslations } from "next-intl";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { AnnouncementDTO } from "../types";

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(day, 10)} ${getMonthName(parseInt(month, 10))} ${year}`;
}

function getMonthName(month: number): string {
  const months = [
    "Oca", "Şub", "Mar", "Nis", "May", "Haz",
    "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
  ];
  return months[month - 1] ?? "";
}

interface AnnouncementCardProps {
  announcement: AnnouncementDTO;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const t = useTranslations("announcements");
  const dateDisplay = formatDate(announcement.publishedAt);

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="shrink-0 text-xs">
            {announcement.category}
          </Badge>
          {dateDisplay && (
            <span className="text-xs text-muted-foreground">{dateDisplay}</span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold leading-snug text-foreground">
        {announcement.title}
      </h3>

      <Link
        href={announcement.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 w-fit text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        {t("readMore")} →
      </Link>
    </div>
  );
}
