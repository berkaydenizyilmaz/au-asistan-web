import { setRequestLocale, getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Database01Icon,
  ArrowRight01Icon,
  ChartHistogramIcon,
  MessageMultiple01Icon,
  UserGroupIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

import { requireAdmin } from "@/lib/auth/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAnalyticsForAdmin } from "@/features/admin/lib/queries";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

const SECTIONS = [
  { key: "rag", href: "/admin/rag", icon: Database01Icon },
  { key: "analytics", href: "/admin/analytics", icon: ChartHistogramIcon },
  { key: "feedback", href: "/admin/feedback", icon: MessageMultiple01Icon },
  { key: "users", href: "/admin/users", icon: UserGroupIcon },
  { key: "cron", href: "/admin/cron", icon: Clock01Icon },
] as const;

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAdmin();
  const t = await getTranslations("admin");

  const analytics = await getAnalyticsForAdmin("7d").catch(() => null);

  const displayName =
    (user.user_metadata?.full_name as string | undefined) || user.email || "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("welcomeTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{displayName}</p>
      </div>

      {analytics && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {t("quickStatsTitle")}
          </h2>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <QuickStatCard
              label={t("analytics.kpiQuestions")}
              value={analytics.questions}
            />
            <QuickStatCard
              label={t("analytics.kpiActiveUsers")}
              value={analytics.activeUsers}
            />
            <QuickStatCard
              label={t("analytics.kpiConversations")}
              value={analytics.conversations}
            />
            <QuickStatCard
              label={t("analytics.kpiFallback")}
              value={analytics.fallback.rate > 0 ? `${analytics.fallback.rate}%` : "—"}
              sub={
                analytics.fallback.count > 0
                  ? String(analytics.fallback.count)
                  : undefined
              }
            />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          {t("sectionsTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <Link key={section.key} href={section.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <HugeiconsIcon
                        icon={section.icon}
                        className="size-5 text-primary"
                      />
                    </div>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-4 text-muted-foreground"
                    />
                  </div>
                  <CardTitle className="mt-3">
                    {t(`${section.key}.title`)}
                  </CardTitle>
                  <CardDescription>
                    {t(`${section.key}.description`)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickStatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
