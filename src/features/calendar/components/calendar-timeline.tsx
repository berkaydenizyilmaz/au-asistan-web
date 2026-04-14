import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { getTodayStr } from "@/lib/date";

import type { CalendarEventDTO } from "../types";
import {
  CalendarEventRow,
  DateBlock,
  formatDateDisplay,
} from "./calendar-event-row";
import { CalendarAutoScroll } from "./calendar-auto-scroll";

interface CalendarTimelineProps {
  events: CalendarEventDTO[];
}

type EventStatus = "past" | "active" | "upcoming";

function getEventStatus(event: CalendarEventDTO, today: string): EventStatus {
  const effectiveEnd = event.endDate ?? event.startDate;
  if (today >= event.startDate && today <= effectiveEnd) return "active";
  if (today > effectiveEnd) return "past";
  return "upcoming";
}

function getActiveProgress(
  startDate: string,
  endDate: string | null,
  today: string,
): number | null {
  if (!endDate || endDate === startDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date(today).getTime();
  const total = end - start;
  if (total <= 0) return null;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function computeDaysRemaining(
  today: string,
  endDate: string | null,
): number | null {
  if (!endDate) return null;
  const from = new Date(today);
  const to = new Date(endDate);
  const diff = Math.ceil(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff > 0 ? diff : null;
}

export function CalendarTimeline({ events }: CalendarTimelineProps) {
  const t = useTranslations("calendar");

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("noActiveCalendar")}</p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          {t("noActiveCalendarDescription")}
        </p>
      </div>
    );
  }

  const today = getTodayStr();

  const pastEvents: CalendarEventDTO[] = [];
  const activeEvents: CalendarEventDTO[] = [];
  const upcomingEvents: CalendarEventDTO[] = [];

  for (const event of events) {
    const status = getEventStatus(event, today);
    if (status === "past") pastEvents.push(event);
    else if (status === "active") activeEvents.push(event);
    else upcomingEvents.push(event);
  }

  const hasNonPast = activeEvents.length > 0 || upcomingEvents.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* ── Past: collapsible summary ── */}
      {pastEvents.length > 0 && hasNonPast && (
        <details className="group overflow-hidden rounded-xl border border-border/50 bg-muted/20">
          <summary className="flex cursor-pointer items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground select-none list-none [&::-webkit-details-marker]:hidden">
            <span className="text-[10px] transition-transform duration-200 group-open:rotate-90">
              ▶
            </span>
            {t("completedCount", { count: pastEvents.length })}
          </summary>
          <div className="space-y-1 border-t border-border/30 px-4 pb-3 pt-2">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-baseline gap-2.5 py-1 text-muted-foreground/70"
              >
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground/50">
                  {formatDateDisplay(event, t)}
                </span>
                <span className="text-sm leading-relaxed">{event.title}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Past: regular list when everything is past ── */}
      {pastEvents.length > 0 && !hasNonPast && (
        <div className="space-y-1 px-1">
          {pastEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-baseline gap-2.5 py-1.5 text-muted-foreground"
            >
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground/60">
                {formatDateDisplay(event, t)}
              </span>
              <span className="text-sm leading-relaxed">{event.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Active: spotlight card(s) ── */}
      {activeEvents.map((event, i) => {
        const progress = getActiveProgress(
          event.startDate,
          event.endDate,
          today,
        );
        const daysRemaining = computeDaysRemaining(today, event.endDate);

        return (
          <div
            key={event.id}
            id={i === 0 ? "calendar-anchor" : undefined}
            className="rounded-2xl border border-border/40 border-l-3 border-l-primary bg-primary/[0.03] p-5"
          >
            {/* Status label */}
            <div className="mb-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {t("happeningNow")}
              </span>
            </div>

            {/* Date block + title */}
            <div className="flex items-start gap-4">
              <DateBlock event={event} variant="active" />
              <p className="min-w-0 flex-1 pt-1 text-base font-semibold leading-relaxed text-foreground">
                {event.title}
              </p>
            </div>

            {/* Progress bar — multi-day events only */}
            {progress !== null && (
              <div className="mt-4 space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-primary/15">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {daysRemaining !== null && (
                  <p className="text-xs text-muted-foreground">
                    {t("daysRemaining", { count: daysRemaining })}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Upcoming: table card ── */}
      {upcomingEvents.length > 0 && (
        <div
          id={activeEvents.length === 0 ? "calendar-anchor" : undefined}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          {upcomingEvents.map((event, i) => (
            <div
              key={event.id}
              className={cn(
                "px-4 py-3.5",
                i > 0 && "border-t border-border/50",
              )}
            >
              <CalendarEventRow event={event} />
            </div>
          ))}
        </div>
      )}

      {hasNonPast && <CalendarAutoScroll />}
    </div>
  );
}
