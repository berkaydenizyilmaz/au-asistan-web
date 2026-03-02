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

  // Daily: compact centered card
  if (view === "daily") {
    const meal = meals[0];
    const isToday = meal.date === todayStr;

    return (
      <div className="flex justify-center pt-2">
        <div className="w-full max-w-md">
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

  // Weekly: 2 columns on large screens
  if (view === "weekly") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto">
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

  // Monthly: responsive grid — larger min column width for uniform card sizes
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
