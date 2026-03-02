import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { MealItem, MealCategory } from "../types";

interface MealCardProps {
  date: string;
  items: MealItem[];
  calories: number | null;
  isToday: boolean;
  expanded?: boolean;
  children?: React.ReactNode;
}

const CATEGORY_ORDER: MealCategory[] = ["soup", "main", "side", "dessert"];

export function MealCard({
  date,
  items,
  calories,
  isToday,
  expanded = false,
  children,
}: MealCardProps) {
  const t = useTranslations("meals");

  const dateObj = new Date(date + "T00:00:00");
  const dayNumber = dateObj.getDate();
  const weekdayKeys = [
    "sun", "mon", "tue", "wed", "thu", "fri", "sat",
  ] as const;
  const weekdayKey = weekdayKeys[dateObj.getDay()];
  const weekday = expanded
    ? t(`weekdaysFull.${weekdayKey}`)
    : t(`weekdays.${weekdayKey}`);

  // Group items by category
  const itemsByCategory = new Map<MealCategory, MealItem[]>();
  for (const item of items) {
    const existing = itemsByCategory.get(item.category) ?? [];
    existing.push(item);
    itemsByCategory.set(item.category, existing);
  }

  return (
    <Card className={isToday ? "ring-primary ring-2" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tabular-nums leading-none">
              {dayNumber}
            </span>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm font-normal">
                {weekday}
              </span>
              {calories !== null && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {t("calories", { count: calories })}
                </span>
              )}
            </div>
            {isToday && <Badge variant="default">{t("today")}</Badge>}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={expanded ? "space-y-3" : "space-y-2"}>
          {CATEGORY_ORDER.map((category) => {
            const categoryItems = itemsByCategory.get(category);
            if (!categoryItems) return null;

            return (
              <div key={category} className="flex items-start gap-3">
                <span className="text-muted-foreground text-xs min-w-20 pt-0.5 shrink-0 uppercase tracking-wider">
                  {t(category)}
                </span>
                <span className={expanded ? "text-base" : "text-sm"}>
                  {categoryItems.map((item) => item.name).join(", ")}
                </span>
              </div>
            );
          })}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
