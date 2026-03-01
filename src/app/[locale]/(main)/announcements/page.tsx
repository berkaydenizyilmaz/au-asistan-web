import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

interface AnnouncementsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AnnouncementsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("announcements") };
}

export default async function AnnouncementsPage({
  params,
}: AnnouncementsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
