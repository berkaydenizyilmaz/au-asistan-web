import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

interface EventsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: EventsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("events") };
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
