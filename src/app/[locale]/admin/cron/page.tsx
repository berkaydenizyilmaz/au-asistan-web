import { setRequestLocale, getTranslations } from "next-intl/server";

import { listCronJobsForAdmin } from "@/features/admin/lib/queries";
import { CronJobsClient } from "@/features/admin/components/cron-jobs-client";

export default async function AdminCronPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, jobs] = await Promise.all([
    getTranslations("admin.cron"),
    listCronJobsForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
      </div>
      <CronJobsClient jobs={jobs} />
    </div>
  );
}
