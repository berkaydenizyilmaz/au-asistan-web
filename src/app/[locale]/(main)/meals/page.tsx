import { setRequestLocale, getTranslations } from "next-intl/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals } from "@/lib/db/schema/content";
import { MealList } from "@/features/meals/components/meal-list";
import { MealNavigation } from "@/features/meals/components/meal-navigation";
import type { ViewMode } from "@/features/meals/components/meal-navigation";
import type { MealItem } from "@/features/meals/types";

interface MealsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; view?: string; day?: string }>;
}

export async function generateMetadata({ params }: MealsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meals" });
  return { title: t("title") };
}

// Clamp date to valid range: Sep 2025 – current month
function clampDate(year: number, month: number) {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  // Min: September 2025
  if (year < 2025 || (year === 2025 && month < 9)) {
    return { year: 2025, month: 9 };
  }
  // Max: current month
  if (year > nowYear || (year === nowYear && month > nowMonth)) {
    return { year: nowYear, month: nowMonth };
  }
  return { year, month };
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  const clamped = clampDate(year, month);
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

  const db = await createDrizzleSupabaseClient();

  if (view === "daily") {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const mealData = await db.admin
      .select()
      .from(meals)
      .where(eq(meals.date, dateStr))
      .limit(1);

    const typedMeals = mealData.map((m) => ({
      id: m.id,
      date: m.date,
      items: m.items as MealItem[],
      calories: m.calories,
    }));

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

    const mealData = await db.admin
      .select()
      .from(meals)
      .where(and(gte(meals.date, from), lte(meals.date, to)))
      .orderBy(asc(meals.date));

    const typedMeals = mealData.map((m) => ({
      id: m.id,
      date: m.date,
      items: m.items as MealItem[],
      calories: m.calories,
    }));

    return (
      <div className="space-y-6">
        <MealNavigation year={year} month={month} day={day} view={view} />
        <MealList meals={typedMeals} view={view} />
      </div>
    );
  }

  // Monthly view
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const mealData = await db.admin
    .select()
    .from(meals)
    .where(and(gte(meals.date, from), lte(meals.date, to)))
    .orderBy(asc(meals.date));

  const typedMeals = mealData.map((m) => ({
    id: m.id,
    date: m.date,
    items: m.items as MealItem[],
    calories: m.calories,
  }));

  return (
    <div className="space-y-6">
      <MealNavigation year={year} month={month} day={day} view={view} />
      <MealList meals={typedMeals} view={view} />
    </div>
  );
}
