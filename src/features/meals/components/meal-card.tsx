import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn, toTitleCase } from "@/lib/utils";

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

  const itemsByCategory = new Map<MealCategory, MealItem[]>();
  for (const item of items) {
    const existing = itemsByCategory.get(item.category) ?? [];
    existing.push(item);
    itemsByCategory.set(item.category, existing);
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card text-card-foreground transition-colors",
        isToday
          ? "border-l-4 border-l-primary border-t-border border-r-border border-b-border bg-primary/3"
          : "border-border"
      )}
    >
      <div className={cn("px-4 pt-4", expanded ? "px-5 pt-5" : "")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={cn(
              "font-bold tabular-nums leading-none",
              expanded ? "text-3xl" : "text-2xl"
            )}>
              {dayNumber}
            </span>
            <span className="text-muted-foreground text-sm leading-none">
              {weekday}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {calories !== null && (
              <span className={cn(
                "tabular-nums font-medium text-muted-foreground",
                expanded ? "text-sm" : "text-xs"
              )}>
                {t("calories", { count: calories })}
              </span>
            )}
            {isToday && (
              <Badge variant="default" className="text-xs">
                {t("today")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 px-4 py-3", expanded ? "px-5 py-4 space-y-2.5" : "space-y-1.5")}>
        {CATEGORY_ORDER.map((category) => {
          const categoryItems = itemsByCategory.get(category);
          if (!categoryItems) return null;

          return (
            <div key={category} className="flex items-baseline gap-3">
              <span className={cn(
                "text-muted-foreground shrink-0 uppercase tracking-wide leading-tight",
                expanded ? "text-[11px] w-22" : "text-[10px] w-18"
              )}>
                {t(category)}
              </span>
              <span className={cn("flex-1", expanded ? "text-[15px]" : "text-sm")}>
                {categoryItems
                  .map((item) => toTitleCase(item.name))
                  .join(", ")}
              </span>
            </div>
          );
        })}
      </div>

      <div className={cn("px-4 pb-4", expanded ? "px-5 pb-5" : "")}>
        {children}
      </div>
    </div>
  );
}
