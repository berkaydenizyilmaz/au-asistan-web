"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

interface EventCategoryFilterProps {
  categories: string[];
  selectedCategory?: string;
}

export function EventCategoryFilter({
  categories,
  selectedCategory,
}: EventCategoryFilterProps) {
  const t = useTranslations("events");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setCategory = useCallback(
    (category: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category) {
        params.set("category", category);
      } else {
        params.delete("category");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory(null)}
        className={cn(
          "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
          !selectedCategory
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-foreground hover:bg-muted",
        )}
      >
        {t("allCategories")}
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
            selectedCategory === cat
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
