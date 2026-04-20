import { useTranslations } from "next-intl";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { EventDTO } from "../types";

function formatEventDate(dateStr: string): { day: string; month: string; year: string } {
  const [year, month, day] = dateStr.split("-");
  const months = [
    "Oca", "Şub", "Mar", "Nis", "May", "Haz",
    "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
  ];
  return {
    day: parseInt(day, 10).toString(),
    month: months[parseInt(month, 10) - 1] ?? "",
    year,
  };
}

interface EventCardProps {
  event: EventDTO;
}

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations("events");
  const { day, month, year } = formatEventDate(event.eventDate);

  return (
    <div className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Date block */}
      <div className="flex w-14 shrink-0 flex-col items-center self-start rounded-lg bg-primary/10 py-2 text-center">
        <span className="text-lg font-bold tabular-nums leading-tight text-primary">
          {day}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-primary/70">
          {month}
        </span>
        <span className="text-[10px] text-primary/50">{year}</span>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {event.category}
          </Badge>
        </div>

        {event.sourceUrl ? (
          <Link
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold leading-snug text-foreground hover:underline"
          >
            {event.title}
          </Link>
        ) : (
          <p className="text-sm font-semibold leading-snug text-foreground">
            {event.title}
          </p>
        )}

        <div className="flex flex-col gap-0.5">
          {event.organizer && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t("organizer")}:</span>{" "}
              {event.organizer}
            </p>
          )}
          {event.location && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t("location")}:</span>{" "}
              {event.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
