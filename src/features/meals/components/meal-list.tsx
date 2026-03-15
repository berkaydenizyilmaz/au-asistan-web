import { useTranslations } from "next-intl";

import type { MealDTO, RatingSummary } from "../types";
import { getTodayStr } from "@/lib/date";
import type { ViewMode } from "./meal-navigation";
import { MealCard } from "./meal-card";
import { MealRating } from "./meal-rating";

interface MealListProps {
  meals: MealDTO[];
  view: ViewMode;
  ratingsMap: Map<string, RatingSummary>;
}

export function MealList({ meals, view, ratingsMap }: MealListProps) {
  const t = useTranslations("meals");

  if (meals.length === 0) {
    const message = view === "daily" ? t("noMealToday") : t("noMeals");
    return (
      <p className="text-muted-foreground text-center py-16">{message}</p>
    );
  }

  const todayStr = getTodayStr();

  if (view === "daily") {
    const meal = meals[0];
    const isToday = meal.date === todayStr;

    return (
      <div className="flex justify-center pt-2">
        <div className="w-full max-w-md" key={meal.id}>
          <MealCard
            date={meal.date}
            items={meal.items}
            calories={meal.calories}
            isToday={isToday}
            expanded
          >
            <MealRating mealId={meal.id} isToday={isToday} initialData={ratingsMap.get(meal.id)} />
          </MealCard>
        </div>
      </div>
    );
  }

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
              <MealRating mealId={meal.id} isToday={isToday} initialData={ratingsMap.get(meal.id)} />
            </MealCard>
          );
        })}
      </div>
    );
  }

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
            <MealRating mealId={meal.id} isToday={isToday} initialData={ratingsMap.get(meal.id)} />
          </MealCard>
        );
      })}
    </div>
  );
}
