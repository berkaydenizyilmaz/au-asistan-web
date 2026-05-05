"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";

import { ChatMessage } from "./chat-message";

const TOOL_LABELS: Record<string, string> = {
  searchKnowledge: "Bilgi tabanı aranıyor...",
  getMealByDate: "Yemek listesi çekiliyor...",
  getMealsByDateRange: "Yemek listesi çekiliyor...",
  getUpcomingCalendarEvents: "Akademik takvim alınıyor...",
  getCalendarEventsByYear: "Akademik takvim alınıyor...",
  getRecentAnnouncements: "Duyurular aranıyor...",
  getUpcomingEvents: "Etkinlikler aranıyor...",
};

interface ChatMessageListProps {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  feedbackMap?: Record<string, "like" | "dislike">;
  onFeedback?: (messageId: string, rating: "like" | "dislike") => void;
  showFeedback?: boolean;
}

function hasText(message: UIMessage) {
  return message.parts.some((p) => p.type === "text" && p.text.length > 0);
}

export function ChatMessageList({
  messages,
  status,
  feedbackMap,
  onFeedback,
  showFeedback,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, status]);

  const lastMessage = messages[messages.length - 1];
  const showLoading =
    status === "submitted" ||
    (status === "streaming" &&
      lastMessage?.role === "assistant" &&
      !hasText(lastMessage));

  // In newer AI SDK, tool parts have type `tool-${toolName}` and state "input-streaming" | "input"
  type RawToolPart = { type: string; state: string };
  const activeToolPart =
    status === "streaming" && lastMessage?.role === "assistant"
      ? (lastMessage.parts as RawToolPart[]).find(
          (p) =>
            p.type.startsWith("tool-") &&
            (p.state === "input-streaming" || p.state === "input-available"),
        )
      : undefined;
  const toolLabel = activeToolPart
    ? (TOOL_LABELS[activeToolPart.type.slice(5)] ?? "İşleniyor...")
    : null;

  const isThinking =
    showLoading &&
    !toolLabel &&
    status === "streaming" &&
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => p.type === "reasoning");

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.map((message) => {
          if (showLoading && message.role === "assistant" && !hasText(message)) {
            return null;
          }
          const isLastStreaming =
            status === "streaming" && message === lastMessage;
          return (
            <ChatMessage
              key={message.id}
              message={message}
              feedback={feedbackMap?.[message.id] ?? null}
              onFeedback={(rating) => onFeedback?.(message.id, rating)}
              showFeedback={
                showFeedback &&
                message.role === "assistant" &&
                !isLastStreaming
              }
            />
          );
        })}

        {showLoading && (
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              AÜ
            </div>
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              {toolLabel ? (
                <div className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground animate-pulse">{toolLabel}</span>
                </div>
              ) : isThinking ? (
                <div className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground animate-pulse">Düşünüyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
