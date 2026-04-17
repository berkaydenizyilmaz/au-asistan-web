"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";

import { ChatMessage } from "./chat-message";

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
              <div className="flex items-center gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
