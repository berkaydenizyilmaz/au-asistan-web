import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";

import type { MealItem, MealCategory } from "../types";

interface MealCardProps {
  id: string;
  date: string;
  items: MealItem[];
  calories: number | null;
  isToday: boolean;
  children?: React.ReactNode;
}

const CATEGORY_ORDER: MealCategory[] = ["soup", "main", "side", "dessert"];

export function MealCard({ id, date, items, calories, isToday, children }: MealCardProps) {
  const t = useTranslations("meals");

  const dateObj = new Date(date + "T00:00:00");
  const dayNumber = dateObj.getDate();
  const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const weekday = t(`weekdays.${weekdayKeys[dateObj.getDay()]}`);

  // Group items by category for ordered display
  const itemsByCategory = new Map<MealCategory, MealItem[]>();
  for (const item of items) {
    const existing = itemsByCategory.get(item.category) ?? [];
    existing.push(item);
    itemsByCategory.set(item.category, existing);
  }

  return (
    <Card size="sm" className={isToday ? "ring-primary/30 ring-2" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums">{dayNumber}</span>
          <span className="text-muted-foreground text-sm font-normal">
            {weekday}
          </span>
          {isToday && (
            <Badge variant="default" className="ml-auto">
              {t("today")}
            </Badge>
          )}
        </CardTitle>
        {calories !== null && (
          <CardAction>
            <Badge variant="outline">{t("calories", { count: calories })}</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {CATEGORY_ORDER.map((category) => {
          const categoryItems = itemsByCategory.get(category);
          if (!categoryItems) return null;

          return (
            <div key={category} className="flex items-start gap-2">
              <span className="text-muted-foreground text-xs min-w-16 pt-0.5">
                {t(category)}
              </span>
              <div className="flex flex-wrap gap-1">
                {categoryItems.map((item, i) => (
                  <span key={i} className="text-sm">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {children}
      </CardContent>
    </Card>
  );
}
