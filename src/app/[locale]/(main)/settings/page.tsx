import { setRequestLocale, getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/auth/server";
import { SettingsAccountSection } from "@/features/auth/components/settings-account-section";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("settings") };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser();

  const t = await getTranslations({ locale, namespace: "settings" });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <SettingsAccountSection />
    </div>
  );
}
