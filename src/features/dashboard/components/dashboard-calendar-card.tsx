import { getTranslations } from "next-intl/server";
import { Calendar03Icon } from "@hugeicons/core-free-icons";

import type { CalendarEventDTO } from "@/features/calendar/types";
import { DashboardSection } from "./dashboard-section";

interface DashboardCalendarCardProps {
  events: CalendarEventDTO[];
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${parseInt(day, 10)} ${getMonthShort(parseInt(m, 10))}`;
  };
  return endDate && endDate !== startDate
    ? `${fmt(startDate)} – ${fmt(endDate)}`
    : fmt(startDate);
}

function getMonthShort(m: number): string {
  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  return months[m - 1] ?? "";
}

export async function DashboardCalendarCard({ events }: DashboardCalendarCardProps) {
  const t = await getTranslations("home");

  return (
    <DashboardSection titleKey="upcomingCalendar" href="/calendar" icon={Calendar03Icon}>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCalendarEvents")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-[10px] font-medium tabular-nums text-primary/80 min-w-15">
                {formatDateRange(event.startDate, event.endDate)}
              </span>
              <span className="text-sm leading-snug">{event.title}</span>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
