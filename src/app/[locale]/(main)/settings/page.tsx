import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

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

  return (
    <div>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
