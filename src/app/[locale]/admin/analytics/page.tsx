import { setRequestLocale, getTranslations } from "next-intl/server";

import { getAnalyticsForAdmin } from "@/features/admin/lib/queries";
import { AnalyticsDashboard } from "@/features/admin/components/analytics-dashboard";
import type { AnalyticsRange } from "@/features/admin/lib/validators";

const VALID_RANGES: AnalyticsRange[] = ["7d", "30d", "all"];

export default async function AdminAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const rawRange = sp.range ?? "7d";
  const range: AnalyticsRange = VALID_RANGES.includes(rawRange as AnalyticsRange)
    ? (rawRange as AnalyticsRange)
    : "7d";

  const [t, data] = await Promise.all([
    getTranslations("admin.analytics"),
    getAnalyticsForAdmin(range),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
      </div>
      <AnalyticsDashboard data={data} />
    </div>
  );
}
