"use client";

import { useTranslations } from "next-intl";

import { useRouter, usePathname } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { AnalyticsDTO } from "../lib/queries";
import type { AnalyticsRange } from "../lib/validators";

interface AnalyticsDashboardProps {
  data: AnalyticsDTO;
}

function KpiCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const t = useTranslations("admin.analytics");
  const router = useRouter();
  const pathname = usePathname();

  function handleRangeChange(value: AnalyticsRange) {
    const params = value !== "7d" ? `?range=${value}` : "";
    router.replace(`${pathname}${params}`, { scroll: false });
  }

  const fmtMs = (ms: number | null) =>
    ms != null ? `${ms.toLocaleString("tr-TR")} ms` : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Label className="text-sm shrink-0">{t("rangeLabel")}</Label>
        <Select value={data.range} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t("range7d")}</SelectItem>
            <SelectItem value="30d">{t("range30d")}</SelectItem>
            <SelectItem value="all">{t("rangeAll")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard
          title={t("kpiQuestions")}
          value={data.questions.toLocaleString("tr-TR")}
        />
        <KpiCard
          title={t("kpiAnswers")}
          value={data.answers.toLocaleString("tr-TR")}
        />
        <KpiCard
          title={t("kpiFallback")}
          value={data.fallback.count.toLocaleString("tr-TR")}
          description={t("kpiFallbackDesc", { rate: data.fallback.rate })}
        />
        <KpiCard
          title={t("kpiAvgResponseTime")}
          value={fmtMs(data.avgResponseTimeMs)}
        />
        <KpiCard
          title={t("kpiToolUsage")}
          value={data.toolUsage.count.toLocaleString("tr-TR")}
          description={t("kpiToolUsageDesc", { rate: data.toolUsage.rate })}
        />
        <KpiCard
          title={t("kpiFeedback")}
          value={data.feedback.total.toLocaleString("tr-TR")}
          description={t("kpiPositiveRate", {
            rate: data.feedback.positiveRate,
          })}
        />
        <KpiCard
          title={t("kpiActiveUsers")}
          value={data.activeUsers.toLocaleString("tr-TR")}
        />
        <KpiCard
          title={t("kpiConversations")}
          value={data.conversations.toLocaleString("tr-TR")}
        />
        <KpiCard
          title={t("kpiAvgChunkCount")}
          value={data.avgChunkCount != null ? data.avgChunkCount : "—"}
        />
      </div>
    </div>
  );
}
