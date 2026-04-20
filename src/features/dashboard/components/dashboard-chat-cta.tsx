"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const SUGGESTION_KEYS = [
  "suggestMeals",
  "suggestCalendar",
  "suggestAnnouncements",
  "suggestEvents",
] as const;

export function DashboardChatCta() {
  const t = useTranslations("home");
  const router = useRouter();
  const [input, setInput] = useState("");

  function navigate(text: string) {
    if (!text.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(text.trim())}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPlaceholder")}
          className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none ring-ring transition-shadow focus:ring-2 placeholder:text-muted-foreground"
        />
        <Button type="submit" disabled={!input.trim()}>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          <span className="hidden sm:inline">{t("askButton")}</span>
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTION_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(t(key))}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}
