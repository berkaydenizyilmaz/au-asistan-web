import { useTranslations } from "next-intl";

import type { MealItem } from "../types";
import type { ViewMode } from "./meal-navigation";
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
  view: ViewMode;
}

function getTodayStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function MealList({ meals, view }: MealListProps) {
  const t = useTranslations("meals");

  if (meals.length === 0) {
    const message = view === "daily" ? t("noMealToday") : t("noMeals");
    return (
      <p className="text-muted-foreground text-center py-16">{message}</p>
    );
  }

  const todayStr = getTodayStr();

  // Daily: centered, generous spacing
  if (view === "daily") {
    const meal = meals[0];
    const isToday = meal.date === todayStr;

    return (
      <div className="flex items-start justify-center pt-4">
        <div className="w-full max-w-2xl">
          <MealCard
            date={meal.date}
            items={meal.items}
            calories={meal.calories}
            isToday={isToday}
            expanded
          >
            <MealRating mealId={meal.id} isToday={isToday} />
          </MealCard>
        </div>
      </div>
    );
  }

  // Weekly: centered column
  if (view === "weekly") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {meals.map((meal) => {
          const isToday = meal.date === todayStr;
          return (
            <MealCard
              key={meal.id}
              date={meal.date}
              items={meal.items}
              calories={meal.calories}
              isToday={isToday}
              expanded
            >
              <MealRating mealId={meal.id} isToday={isToday} />
            </MealCard>
          );
        })}
      </div>
    );
  }

  // Monthly: responsive grid
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => {
        const isToday = meal.date === todayStr;
        return (
          <MealCard
            key={meal.id}
            date={meal.date}
            items={meal.items}
            calories={meal.calories}
            isToday={isToday}
          >
            <MealRating mealId={meal.id} isToday={isToday} />
          </MealCard>
        );
      })}
    </div>
  );
}
