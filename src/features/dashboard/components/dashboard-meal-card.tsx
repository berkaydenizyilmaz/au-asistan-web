import { getTranslations } from "next-intl/server";
import { Restaurant01Icon } from "@hugeicons/core-free-icons";

import { cn, toTitleCase } from "@/lib/utils";
import type { MealDTO, MealItem } from "@/features/meals/types";
import { DashboardSection } from "./dashboard-section";

interface DashboardMealCardProps {
  meal: MealDTO | null;
}

const CATEGORY_ORDER = ["soup", "main", "side", "dessert"] as const;

export async function DashboardMealCard({ meal }: DashboardMealCardProps) {
  const t = await getTranslations("home");
  const tm = await getTranslations("meals");

  if (!meal) {
    return (
      <DashboardSection titleKey="todaysMeal" href="/meals" icon={Restaurant01Icon}>
        <p className="text-sm text-muted-foreground">{t("noMealToday")}</p>
      </DashboardSection>
    );
  }

  const itemsByCategory = new Map<string, MealItem[]>();
  for (const item of meal.items) {
    const existing = itemsByCategory.get(item.category) ?? [];
    existing.push(item);
    itemsByCategory.set(item.category, existing);
  }

  return (
    <DashboardSection titleKey="todaysMeal" href="/meals" icon={Restaurant01Icon}>
      <div className="flex flex-col gap-1.5">
        {CATEGORY_ORDER.map((category) => {
          const items = itemsByCategory.get(category);
          if (!items) return null;
          return (
            <div key={category} className="flex items-baseline gap-2">
              <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                {tm(category)}
              </span>
              <span className="flex-1 text-sm leading-snug">
                {items.map((i) => toTitleCase(i.name)).join(", ")}
              </span>
            </div>
          );
        })}
        {meal.calories !== null && (
          <p className={cn("mt-1 text-xs text-muted-foreground")}>
            {tm("calories", { count: meal.calories })}
          </p>
        )}
      </div>
    </DashboardSection>
  );
}
