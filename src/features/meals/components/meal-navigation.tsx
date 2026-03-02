"use client";

import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

interface MealNavigationProps {
  year: number;
  month: number;
}

export function MealNavigation({ year, month }: MealNavigationProps) {
  const t = useTranslations("meals");
  const router = useRouter();
  const pathname = usePathname();

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  function navigate(direction: -1 | 1) {
    let newMonth = month + direction;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    const isNowMonth =
      newYear === now.getFullYear() && newMonth === now.getMonth() + 1;
    if (isNowMonth) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?month=${newYear}-${String(newMonth).padStart(2, "0")}`);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => navigate(-1)}
        aria-label={t("previousMonth")}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} />
      </Button>
      <h1 className="text-lg font-semibold min-w-36 text-center">
        {t(`months.${month}`)} {year}
      </h1>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        aria-label={t("nextMonth")}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} />
      </Button>
    </div>
  );
}
