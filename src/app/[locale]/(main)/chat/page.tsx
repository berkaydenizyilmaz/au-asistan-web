import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

interface ChatPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("newChat") };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
