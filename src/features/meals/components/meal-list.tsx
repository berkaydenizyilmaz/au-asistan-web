import { useTranslations } from "next-intl";

import type { MealItem } from "../types";
import { MealCard } from "./meal-card";
import { MealRating } from "./meal-rating";

interface MealData {
  id: string;
  date: string;
  items: MealItem[];
  calories: number | null;
}

interface MealListProps {
  meals: MealData[];
}

export function MealList({ meals }: MealListProps) {
  const t = useTranslations("meals");

  if (meals.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">{t("noMeals")}</p>
    );
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => (
        <MealCard
          key={meal.id}
          id={meal.id}
          date={meal.date}
          items={meal.items as MealItem[]}
          calories={meal.calories}
          isToday={meal.date === todayStr}
        >
          <MealRating mealId={meal.id} />
        </MealCard>
      ))}
    </div>
  );
}
