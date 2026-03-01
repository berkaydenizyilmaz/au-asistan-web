import { setRequestLocale, getTranslations } from "next-intl/server";

interface CalendarPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CalendarPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("calendar") };
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
