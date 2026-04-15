"use client";

import { useTranslations } from "next-intl";

interface ChatEmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

const SUGGESTION_KEYS = [
  "suggestMeals",
  "suggestCalendar",
  "suggestEvents",
] as const;

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  const t = useTranslations("chat");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
          AÜ
        </div>
        <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("emptyDescription")}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTION_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onSuggestionClick(t(key))}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}
