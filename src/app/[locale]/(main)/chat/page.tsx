import { setRequestLocale, getTranslations } from "next-intl/server";

import { ChatContainer } from "@/features/chat/components/chat-container";

interface ChatPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params }: ChatPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("newChat") };
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  return (
    <div className="-m-4 h-[calc(100dvh-(--spacing(14)))] md:-m-6">
      <ChatContainer autoSend={q} />
    </div>
  );
}
