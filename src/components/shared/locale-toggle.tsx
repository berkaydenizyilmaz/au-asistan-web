"use client";

import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/constants";

const LOCALE_LABELS: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
};

export function LocaleToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale: Locale = locale === "tr" ? "en" : "tr";

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSwitch}
      aria-label={LOCALE_LABELS[nextLocale]}
    >
      <span className="text-xs font-semibold">{LOCALE_LABELS[locale]}</span>
    </Button>
  );
}
