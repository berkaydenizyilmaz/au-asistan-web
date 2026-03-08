"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

import { isAfterNow } from "@/lib/date";
import { skipWeekends, isBeforeMin } from "../lib/date-utils";

export type ViewMode = "daily" | "weekly" | "monthly";

interface MealNavigationProps {
  year: number;
  month: number;
  day: number;
  view: ViewMode;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const VIEW_MODES: ViewMode[] = ["daily", "weekly", "monthly"];

function getSteppedDate(view: ViewMode, year: number, month: number, day: number, direction: 1 | -1) {
  if (view === "daily") {
    const d = new Date(year, month - 1, day + direction);
    skipWeekends(d, direction);
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  if (view === "weekly") {
    const d = new Date(year, month - 1, day + direction * 7);
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  // monthly
  let m = month + direction;
  let y = year;
  if (m < 1) { m = 12; y--; }
  if (m > 12) { m = 1; y++; }
  return { year: y, month: m, day };
}

export function MealNavigation({ year, month, day, view }: MealNavigationProps) {
  const t = useTranslations("meals");
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(v: ViewMode, y: number, m: number, d: number) {
    const params = new URLSearchParams();
    params.set("view", v);
    params.set("month", `${y}-${String(m).padStart(2, "0")}`);
    if (v === "daily") params.set("day", String(d));
    return `${pathname}?${params.toString()}`;
  }

  function navigate(direction: 1 | -1) {
    const target = getSteppedDate(view, year, month, day, direction);
    router.push(buildUrl(view, target.year, target.month, target.day));
  }

  const prev = useMemo(() => getSteppedDate(view, year, month, day, -1), [view, year, month, day]);
  const next = useMemo(() => getSteppedDate(view, year, month, day, 1), [view, year, month, day]);

  const prevDisabled = isBeforeMin(prev.year, prev.month);
  const nextDisabled = view === "daily"
    ? isAfterNow(next.year, next.month, next.day)
    : isAfterNow(next.year, next.month);

  const label = useMemo(() => {
    if (view === "daily") {
      const dateObj = new Date(year, month - 1, day);
      const wd = t(`weekdaysFull.${WEEKDAY_KEYS[dateObj.getDay()]}`);
      return `${day} ${t(`months.${month}`)} – ${wd}`;
    }
    if (view === "weekly") {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(dateObj);
      monday.setDate(dateObj.getDate() + mondayOffset);
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);

      const startStr = `${monday.getDate()} ${t(`months.${monday.getMonth() + 1}`)}`;
      const endStr = `${friday.getDate()} ${t(`months.${friday.getMonth() + 1}`)}`;
      return t("weekLabel", { start: startStr, end: endStr });
    }
    return `${t(`months.${month}`)} ${year}`;
  }, [view, year, month, day, t]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 rounded-full bg-muted p-1">
        {VIEW_MODES.map((v) => (
          <Button
            key={v}
            variant={view === v ? "default" : "ghost"}
            size="sm"
            className="rounded-full text-xs px-3 h-7"
            onClick={() => router.push(buildUrl(v, year, month, day))}
          >
            {t(`view${v.charAt(0).toUpperCase() + v.slice(1)}` as "viewDaily" | "viewWeekly" | "viewMonthly")}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => navigate(-1)}
          disabled={prevDisabled}
          aria-label={t("previous")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <span className="text-sm font-medium min-w-44 text-center">
          {label}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => navigate(1)}
          disabled={nextDisabled}
          aria-label={t("next")}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} />
        </Button>
      </div>
    </div>
  );
}
