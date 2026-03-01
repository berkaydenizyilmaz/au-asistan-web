import { setRequestLocale, getTranslations } from "next-intl/server";

interface MealsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: MealsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("meals") };
}

export default async function MealsPage({ params }: MealsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
