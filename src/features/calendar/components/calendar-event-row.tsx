import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { CalendarEventDTO } from "../types";

function formatDay(dateStr: string) {
  return parseInt(dateStr.split("-")[2], 10);
}

function formatMonthKey(dateStr: string) {
  return String(parseInt(dateStr.split("-")[1], 10));
}

export function formatDateDisplay(
  event: CalendarEventDTO,
  t: (key: string) => string,
): string {
  const startDay = formatDay(event.startDate);
  const startMonthKey = formatMonthKey(event.startDate);

  const hasRange = event.endDate && event.endDate !== event.startDate;
  const endDay = hasRange ? formatDay(event.endDate!) : null;
  const endMonthKey = hasRange ? formatMonthKey(event.endDate!) : null;
  const crossMonth = hasRange && startMonthKey !== endMonthKey;

  if (crossMonth) {
    return `${startDay} ${t(`months.${startMonthKey}`)} – ${endDay} ${t(`months.${endMonthKey}`)}`;
  }
  if (hasRange) {
    return `${startDay}–${endDay} ${t(`months.${startMonthKey}`)}`;
  }
  return `${startDay} ${t(`months.${startMonthKey}`)}`;
}

/* ── DateBlock ─────────────────────────────────── */

type DateBlockVariant = "default" | "muted" | "active";

const VARIANT_STYLES: Record<
  DateBlockVariant,
  { bg: string; day: string; month: string }
> = {
  default: {
    bg: "bg-muted",
    day: "text-foreground",
    month: "text-muted-foreground",
  },
  muted: {
    bg: "bg-muted/50",
    day: "text-muted-foreground/60",
    month: "text-muted-foreground/40",
  },
  active: {
    bg: "bg-primary/10",
    day: "text-primary",
    month: "text-primary/70",
  },
};

interface DateBlockProps {
  event: CalendarEventDTO;
  variant?: DateBlockVariant;
}

export function DateBlock({ event, variant = "default" }: DateBlockProps) {
  const t = useTranslations("calendar");
  const s = VARIANT_STYLES[variant];

  const startDay = formatDay(event.startDate);
  const startMonthKey = formatMonthKey(event.startDate);
  const startMonth = t(`months.${startMonthKey}`);

  const hasRange = event.endDate && event.endDate !== event.startDate;
  const endDay = hasRange ? formatDay(event.endDate!) : null;
  const endMonthKey = hasRange ? formatMonthKey(event.endDate!) : null;
  const crossMonth = hasRange && startMonthKey !== endMonthKey;

  // Cross-month range — two-line compact pill
  if (crossMonth) {
    const endMonth = t(`months.${endMonthKey}`);
    return (
      <div
        className={cn(
          "shrink-0 self-start rounded-lg px-3 py-2 text-center",
          s.bg,
        )}
      >
        <p
          className={cn(
            "text-[11px] font-semibold tabular-nums leading-snug",
            s.day,
          )}
        >
          {startDay} {startMonth} –
        </p>
        <p
          className={cn(
            "text-[11px] font-semibold tabular-nums leading-snug",
            s.day,
          )}
        >
          {endDay} {endMonth}
        </p>
      </div>
    );
  }

  // Single day or same-month range — structured block (day hero + month label)
  const dayDisplay = hasRange ? `${startDay}–${endDay}` : String(startDay);

  return (
    <div
      className={cn(
        "flex w-20 shrink-0 flex-col items-center self-start rounded-lg px-2 py-2 text-center",
        s.bg,
      )}
    >
      <span
        className={cn("text-base font-bold tabular-nums leading-tight", s.day)}
      >
        {dayDisplay}
      </span>
      <span
        className={cn("mt-0.5 text-[10px] uppercase tracking-wide", s.month)}
      >
        {startMonth}
      </span>
    </div>
  );
}

/* ── CalendarEventRow ──────────────────────────── */

interface CalendarEventRowProps {
  event: CalendarEventDTO;
}

export function CalendarEventRow({ event }: CalendarEventRowProps) {
  return (
    <div className="flex items-start gap-3.5">
      <DateBlock event={event} />
      <p className="min-w-0 flex-1 pt-2 text-sm font-medium leading-relaxed text-foreground">
        {event.title}
      </p>
    </div>
  );
}
