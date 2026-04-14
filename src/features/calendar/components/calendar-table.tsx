import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTodayStr } from "@/lib/date";

import type { CalendarEventDTO } from "../types";
import { CalendarAutoScroll } from "./calendar-auto-scroll";

type EventStatus = "past" | "active" | "upcoming";

function getEventStatus(event: CalendarEventDTO, today: string): EventStatus {
  const effectiveEnd = event.endDate ?? event.startDate;
  if (today >= event.startDate && today <= effectiveEnd) return "active";
  if (today > effectiveEnd) return "past";
  return "upcoming";
}

function formatDay(dateStr: string) {
  return parseInt(dateStr.split("-")[2], 10);
}

function formatMonthKey(dateStr: string) {
  return String(parseInt(dateStr.split("-")[1], 10));
}

function DateCell({ event }: { event: CalendarEventDTO }) {
  const t = useTranslations("calendar");

  const startDay = formatDay(event.startDate);
  const startMonth = t(`months.${formatMonthKey(event.startDate)}`);

  const hasRange = event.endDate && event.endDate !== event.startDate;

  if (!hasRange) {
    return (
      <div>
        <span className="text-sm font-semibold tabular-nums">{startDay}</span>
        <span className="ml-1 text-xs text-muted-foreground">{startMonth}</span>
      </div>
    );
  }

  const endDay = formatDay(event.endDate!);
  const endMonthKey = formatMonthKey(event.endDate!);
  const startMonthKey = formatMonthKey(event.startDate);
  const crossMonth = startMonthKey !== endMonthKey;
  const endMonth = t(`months.${endMonthKey}`);

  if (crossMonth) {
    return (
      <div className="text-sm tabular-nums">
        <span className="font-semibold">{startDay}</span>
        <span className="ml-1 text-xs text-muted-foreground">{startMonth}</span>
        <span className="mx-1 text-muted-foreground/60">–</span>
        <span className="font-semibold">{endDay}</span>
        <span className="ml-1 text-xs text-muted-foreground">{endMonth}</span>
      </div>
    );
  }

  return (
    <div>
      <span className="text-sm font-semibold tabular-nums">
        {startDay}–{endDay}
      </span>
      <span className="ml-1 text-xs text-muted-foreground">{startMonth}</span>
    </div>
  );
}

interface CalendarTableProps {
  events: CalendarEventDTO[];
}

export function CalendarTable({ events }: CalendarTableProps) {
  const t = useTranslations("calendar");

  if (events.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">{t("noActiveCalendar")}</p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          {t("noActiveCalendarDescription")}
        </p>
      </div>
    );
  }

  const today = getTodayStr();

  const tagged = events.map((event) => ({
    event,
    status: getEventStatus(event, today),
  }));

  // Anchor: first non-past event
  const anchorId = tagged.find((t) => t.status !== "past")?.event.id ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {tagged.map(({ event, status }, index) => (
          <div
            key={event.id}
            id={event.id === anchorId ? "calendar-anchor" : undefined}
            className={cn(
              "flex items-start gap-4 border-l-3 px-4 py-3 sm:gap-6",
              // Zebra striping
              index % 2 === 0 ? "bg-card" : "bg-muted/20",
              // Status-based left border
              status === "active"
                ? "border-l-primary bg-primary/5"
                : status === "upcoming"
                  ? "border-l-transparent"
                  : "border-l-transparent",
              // Top border between rows (except first)
              index > 0 && "border-t border-t-border/50",
            )}
          >
            {/* Date column — fixed width */}
            <div
              className={cn(
                "w-32 shrink-0 sm:w-40",
                status === "active"
                  ? "text-primary"
                  : status === "past"
                    ? "opacity-50"
                    : "",
              )}
            >
              <DateCell event={event} />
            </div>

            {/* Title column — flexible */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    status === "active"
                      ? "font-medium text-foreground"
                      : status === "past"
                        ? "text-muted-foreground"
                        : "text-foreground",
                  )}
                >
                  {event.title}
                </p>
                {status === "active" && (
                  <Badge
                    variant="default"
                    className="shrink-0 text-[10px]"
                  >
                    {t("today")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {anchorId && <CalendarAutoScroll />}
    </div>
  );
}
