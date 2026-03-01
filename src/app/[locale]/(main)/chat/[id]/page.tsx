import { setRequestLocale } from "next-intl/server";

interface ChatDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
