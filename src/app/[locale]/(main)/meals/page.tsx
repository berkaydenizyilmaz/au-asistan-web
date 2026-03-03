import { setRequestLocale, getTranslations } from "next-intl/server";

import { MealList } from "@/features/meals/components/meal-list";
import { MealNavigation } from "@/features/meals/components/meal-navigation";
import type { ViewMode } from "@/features/meals/components/meal-navigation";
import type { MealItem } from "@/features/meals/types";
import {
  formatDate,
  formatMonth,
  getMonday,
  getMonthRange,
  clampMonth,
} from "@/features/meals/lib/date-utils";
import {
  getMealByDate,
  getMealsByDateRange,
} from "@/features/meals/lib/queries";

interface MealsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; view?: string; day?: string }>;
}

export async function generateMetadata({ params }: MealsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meals" });
  return { title: t("title") };
}

// Map DB row to typed meal object
function toTypedMeal(m: { id: string; date: string; items: unknown; calories: number | null }) {
  return { id: m.id, date: m.date, items: m.items as MealItem[], calories: m.calories };
}

export default async function MealsPage({
  params,
  searchParams,
}: MealsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { month: monthParam, view: viewParam, day: dayParam } = await searchParams;

  const now = new Date();
  const view: ViewMode =
    viewParam === "daily" || viewParam === "weekly" || viewParam === "monthly"
      ? viewParam
      : "monthly";

  // Parse month parameter
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (monthParam) {
    const match = monthParam.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
    }
  }

  // Clamp to valid range
  const clamped = clampMonth(year, month);
  year = clamped.year;
  month = clamped.month;

  // Parse day for daily/weekly views
  let day = now.getDate();
  if (dayParam) {
    const parsed = parseInt(dayParam, 10);
    if (parsed >= 1 && parsed <= 31) day = parsed;
  }

  // Clamp day if we're in the clamped month and the day exceeds current date
  if (year === now.getFullYear() && month === now.getMonth() + 1 && day > now.getDate()) {
    day = now.getDate();
  }

  if (view === "daily") {
    const dateStr = `${formatMonth(year, month)}-${String(day).padStart(2, "0")}`;
    const meal = await getMealByDate(dateStr);
    const typedMeals = meal ? [toTypedMeal(meal)] : [];

    return (
      <div className="space-y-6">
        <MealNavigation year={year} month={month} day={day} view={view} />
        <MealList meals={typedMeals} view={view} />
      </div>
    );
  }

  if (view === "weekly") {
    const targetDate = new Date(year, month - 1, day);
    const monday = getMonday(targetDate);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const from = formatDate(monday);
    const to = formatDate(friday);
    const mealData = await getMealsByDateRange(from, to);

    return (
      <div className="space-y-6">
        <MealNavigation year={year} month={month} day={day} view={view} />
        <MealList meals={mealData.map(toTypedMeal)} view={view} />
      </div>
    );
  }

  // Monthly view
  const { from, to } = getMonthRange(year, month);
  const mealData = await getMealsByDateRange(from, to);

  return (
    <div className="space-y-6">
      <MealNavigation year={year} month={month} day={day} view={view} />
      <MealList meals={mealData.map(toTypedMeal)} view={view} />
    </div>
  );
}
