import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

import { Link } from "@/i18n/navigation";

interface DashboardSectionProps {
  titleKey: string;
  href: string;
  icon: IconSvgElement;
  children: React.ReactNode;
}

export async function DashboardSection({
  titleKey,
  href,
  icon,
  children,
}: DashboardSectionProps) {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={icon} className="size-4 text-primary" />
          <span className="text-sm font-semibold">{t(titleKey as Parameters<typeof t>[0])}</span>
        </div>
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("viewAll")} →
        </Link>
      </div>
      {children}
    </div>
  );
}
