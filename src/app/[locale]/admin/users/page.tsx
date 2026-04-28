import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/lib/auth/server";
import { listUsersForAdmin } from "@/features/admin/lib/queries";
import { UsersTableClient } from "@/features/admin/components/users-table-client";

const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [t, currentAdmin, result] = await Promise.all([
    getTranslations("admin.users"),
    requireAdmin(),
    listUsersForAdmin({ page, pageSize: PAGE_SIZE }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
      </div>
      <UsersTableClient
        items={result.items}
        total={result.total}
        page={page}
        pageSize={PAGE_SIZE}
        currentUserId={currentAdmin.id}
      />
    </div>
  );
}
