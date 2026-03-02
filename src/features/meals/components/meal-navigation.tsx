"use client";

import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export type ViewMode = "daily" | "weekly" | "monthly";

interface MealNavigationProps {
  year: number;
  month: number;
  day: number;
  view: ViewMode;
}

// Earliest data we'd reasonably have (current academic year start)
const MIN_YEAR = 2025;
const MIN_MONTH = 9; // September 2025

function isBeforeMin(year: number, month: number) {
  return year < MIN_YEAR || (year === MIN_YEAR && month < MIN_MONTH);
}

function isAfterNow(year: number, month: number, day?: number) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  if (year > nowYear) return true;
  if (year === nowYear && month > nowMonth) return true;
  if (day && year === nowYear && month === nowMonth && day > nowDay) return true;
  return false;
}

export function MealNavigation({ year, month, day, view }: MealNavigationProps) {
  const t = useTranslations("meals");
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(params: { view?: ViewMode; year?: number; month?: number; day?: number }) {
    const v = params.view ?? view;
    const y = params.year ?? year;
    const m = params.month ?? month;
    const d = params.day ?? day;

    const now = new Date();
    const isNow =
      y === now.getFullYear() &&
      m === now.getMonth() + 1 &&
      (v !== "daily" || d === now.getDate());

    if (isNow && v === "monthly") return pathname;

    const parts = [`view=${v}`, `month=${y}-${String(m).padStart(2, "0")}`];
    if (v === "daily") parts.push(`day=${d}`);
    return `${pathname}?${parts.join("&")}`;
  }

  function navigatePrev() {
    if (view === "daily") {
      // Go to previous day (skip weekends)
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() - 1);
      // Skip weekends backward
      while (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() - 1);
      }
      router.push(buildUrl({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      }));
    } else if (view === "weekly") {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() - 7);
      router.push(buildUrl({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      }));
    } else {
      let newMonth = month - 1;
      let newYear = year;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      router.push(buildUrl({ year: newYear, month: newMonth }));
    }
  }

  function navigateNext() {
    if (view === "daily") {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() + 1);
      }
      router.push(buildUrl({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      }));
    } else if (view === "weekly") {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + 7);
      router.push(buildUrl({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      }));
    } else {
      let newMonth = month + 1;
      let newYear = year;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
      router.push(buildUrl({ year: newYear, month: newMonth }));
    }
  }

  // Compute disabled states
  const prevDisabled = (() => {
    if (view === "monthly") return isBeforeMin(year, month - 1 < 1 ? 12 : month - 1);
    if (view === "daily") {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() - 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return isBeforeMin(d.getFullYear(), d.getMonth() + 1);
    }
    // weekly
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - 7);
    return isBeforeMin(d.getFullYear(), d.getMonth() + 1);
  })();

  const nextDisabled = (() => {
    if (view === "monthly") {
      const nm = month + 1 > 12 ? 1 : month + 1;
      const ny = month + 1 > 12 ? year + 1 : year;
      return isAfterNow(ny, nm);
    }
    if (view === "daily") {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
      return isAfterNow(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    // weekly
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 7);
    // Disable if the Monday of next week is after now
    return isAfterNow(d.getFullYear(), d.getMonth() + 1, d.getDate());
  })();

  // Build label
  const label = (() => {
    if (view === "daily") {
      const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
      const dateObj = new Date(year, month - 1, day);
      const wd = t(`weekdaysFull.${weekdayKeys[dateObj.getDay()]}`);
      return `${day} ${t(`months.${month}`)} – ${wd}`;
    }
    if (view === "weekly") {
      // Find Monday of the week containing `day`
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
  })();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* View mode toggle */}
      <div className="flex gap-1 rounded-full bg-muted p-1">
        {(["daily", "weekly", "monthly"] as const).map((v) => (
          <Button
            key={v}
            variant={view === v ? "default" : "ghost"}
            size="sm"
            className="rounded-full text-xs px-3 h-7"
            onClick={() => router.push(buildUrl({ view: v }))}
          >
            {t(`view${v.charAt(0).toUpperCase() + v.slice(1)}` as "viewDaily" | "viewWeekly" | "viewMonthly")}
          </Button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={navigatePrev}
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
          onClick={navigateNext}
          disabled={nextDisabled}
          aria-label={t("next")}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} />
        </Button>
      </div>
    </div>
  );
}
