import { setRequestLocale, getTranslations } from "next-intl/server";

import { getNowParts, formatDateInTimezone } from "@/lib/date";
import { getOptionalUser } from "@/lib/auth/server";
import { MealList } from "@/features/meals/components/meal-list";
import { MealNavigation } from "@/features/meals/components/meal-navigation";
import type { ViewMode } from "@/features/meals/components/meal-navigation";
import {
  formatMonth,
  getMonday,
  getMonthRange,
  clampMonth,
} from "@/features/meals/lib/date-utils";
import {
  getMealByDate,
  getMealsByDateRange,
  getMealRatingSummaries,
} from "@/features/meals/lib/queries";
import type { MealDTO } from "@/features/meals/types";

interface MealsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; view?: string; day?: string }>;
}

export async function generateMetadata({ params }: MealsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meals" });
  return { title: t("title") };
}

export default async function MealsPage({
  params,
  searchParams,
}: MealsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { month: monthParam, view: viewParam, day: dayParam } = await searchParams;

  const now = getNowParts();
  const view: ViewMode =
    viewParam === "daily" || viewParam === "weekly" || viewParam === "monthly"
      ? viewParam
      : "monthly";

  let year = now.year;
  let month = now.month;
  if (monthParam) {
    const match = monthParam.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
    }
  }

  const clamped = clampMonth(year, month);
  year = clamped.year;
  month = clamped.month;

  let day = now.day;
  if (dayParam) {
    const parsed = parseInt(dayParam, 10);
    if (parsed >= 1 && parsed <= 31) day = parsed;
  }

  if (year === now.year && month === now.month && day > now.day) {
    day = now.day;
  }

  let meals: MealDTO[];

  if (view === "daily") {
    const dateStr = `${formatMonth(year, month)}-${String(day).padStart(2, "0")}`;
    const meal = await getMealByDate(dateStr);
    meals = meal ? [meal] : [];
  } else if (view === "weekly") {
    const targetDate = new Date(year, month - 1, day);
    const monday = getMonday(targetDate);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    meals = await getMealsByDateRange(formatDateInTimezone(monday), formatDateInTimezone(friday));
  } else {
    const { from, to } = getMonthRange(year, month);
    meals = await getMealsByDateRange(from, to);
  }

  const user = await getOptionalUser();
  const ratingsMap = await getMealRatingSummaries(
    meals.map((m) => m.id),
    user?.id,
  );

  return (
    <div className="space-y-6">
      <MealNavigation year={year} month={month} day={day} view={view} />
      <MealList meals={meals} view={view} ratingsMap={ratingsMap} />
    </div>
  );
}
