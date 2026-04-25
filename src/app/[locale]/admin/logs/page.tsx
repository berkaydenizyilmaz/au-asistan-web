import { setRequestLocale } from "next-intl/server";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminComingSoon titleKey="logs" />;
}
