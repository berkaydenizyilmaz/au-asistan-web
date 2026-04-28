import { getTranslations, setRequestLocale } from "next-intl/server";

import { listFeedbackForAdmin } from "@/features/admin/lib/queries";
import type { FeedbackFilters } from "@/features/admin/lib/queries";
import { FeedbackTableClient } from "@/features/admin/components/feedback-table-client";

interface AdminFeedbackPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ rating?: string; fallback?: string; page?: string }>;
}

export default async function AdminFeedbackPage({
  params,
  searchParams,
}: AdminFeedbackPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.feedback");
  const sp = await searchParams;

  const filters: FeedbackFilters = {
    rating:
      sp.rating === "up" || sp.rating === "down" ? sp.rating : undefined,
    onlyFallback: sp.fallback === "1",
  };
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 50;

  const { items, total } = await listFeedbackForAdmin(filters, {
    page,
    pageSize,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
      </div>
      <FeedbackTableClient
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        filters={filters}
      />
    </div>
  );
}
