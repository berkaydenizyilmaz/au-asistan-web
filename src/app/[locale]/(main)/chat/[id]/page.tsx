import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getConversation } from "@/features/chat/lib/queries";
import { toUIMessages } from "@/features/chat/lib/message-utils";
import { ChatContainer } from "@/features/chat/components/chat-container";

interface ChatDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const initialFeedback: Record<string, "like" | "dislike"> = {};
  for (const msg of conversation.messages) {
    if (msg.feedback) initialFeedback[msg.id] = msg.feedback;
  }

  return (
    <div className="-m-4 h-[calc(100dvh-(--spacing(14)))] md:-m-6">
      <ChatContainer
        chatId={conversation.id}
        initialMessages={toUIMessages(conversation.messages)}
        initialFeedback={initialFeedback}
      />
    </div>
  );
}
