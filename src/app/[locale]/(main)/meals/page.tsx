import { setRequestLocale, getTranslations } from "next-intl/server";
import { and, asc, gte, lte } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals } from "@/lib/db/schema/content";
import { MealList } from "@/features/meals/components/meal-list";
import { MealNavigation } from "@/features/meals/components/meal-navigation";
import type { MealItem } from "@/features/meals/types";

interface MealsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
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

  const { month: monthParam } = await searchParams;

  // Parse month parameter or default to current month
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (monthParam) {
    const match = monthParam.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
    }
  }

  // Calculate date range for the month
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Fetch meals directly from DB (server component read-only)
  const db = await createDrizzleSupabaseClient();
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
      <MealNavigation year={year} month={month} />
      <MealList meals={typedMeals} />
    </div>
  );
}
