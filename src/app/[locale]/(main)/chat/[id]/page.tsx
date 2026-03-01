import { setRequestLocale, getTranslations } from "next-intl/server";

interface ChatDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
