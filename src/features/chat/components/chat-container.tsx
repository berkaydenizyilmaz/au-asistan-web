"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";

import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api/client";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

interface ChatContainerProps {
  chatId?: string;
  initialMessages?: UIMessage[];
  initialFeedback?: Record<string, "like" | "dislike">;
  autoSend?: string;
}

let _conversationId: string | null = null;

const transport = new DefaultChatTransport({
  api: "/api/chat",
  fetch: async (url, options) => {
    const response = await fetch(url, options);

    const newId = response.headers.get("X-Conversation-Id");
    if (newId && !_conversationId) {
      _conversationId = newId;
      const currentPath = window.location.pathname;
      const locale = currentPath.split("/")[1];
      window.history.replaceState(null, "", `/${locale}/chat/${newId}`);
    }

    return response;
  },
});

export function ChatContainer({
  chatId,
  initialMessages,
  initialFeedback,
  autoSend,
}: ChatContainerProps) {
  const [input, setInput] = useState("");
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "like" | "dislike">>(
    initialFeedback ?? {},
  );
  const t = useTranslations("chat");
  const user = useAuthStore((s) => s.user);
  const isGuest = !user;

  const chatHookProps = {
    ...(chatId && { id: chatId }),
    ...(initialMessages && { messages: initialMessages }),
    transport,
  };

  const { messages, sendMessage, setMessages, status, error } =
    useChat(chatHookProps);

  useEffect(() => {
    _conversationId = chatId ?? null;

    return () => {
      _conversationId = null;
    };
  }, [chatId]);

  const isLoading = status === "streaming" || status === "submitted";

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setFeedbackMap({});
    _conversationId = null;
    const locale = window.location.pathname.split("/")[1];
    window.history.replaceState(null, "", `/${locale}/chat`);
  }, [setMessages]);

  const handleFeedback = useCallback(
    async (messageId: string, rating: "like" | "dislike") => {
      const prev = feedbackMap[messageId];
      const isToggleOff = prev === rating;

      // Optimistic update
      setFeedbackMap((current) => {
        const next = { ...current };
        if (isToggleOff) {
          delete next[messageId];
        } else {
          next[messageId] = rating;
        }
        return next;
      });

      try {
        if (isToggleOff) {
          await apiFetch(`/api/chat/messages/${messageId}/feedback`, {
            method: "DELETE",
          });
        } else {
          await apiFetch(`/api/chat/messages/${messageId}/feedback`, {
            method: "POST",
            body: JSON.stringify({ rating }),
          });
        }
      } catch (error) {
        logger.error("Failed to save feedback", error);
        // Revert optimistic update
        setFeedbackMap((current) => {
          const reverted = { ...current };
          if (prev) {
            reverted[messageId] = prev;
          } else {
            delete reverted[messageId];
          }
          return reverted;
        });
      }
    },
    [feedbackMap],
  );

  const handleSend = useCallback(
    (text?: string) => {
      const content = text ?? input;
      if (!content.trim() || isLoading) return;

      sendMessage(
        { text: content },
        {
          body: { chatId: _conversationId },
        },
      );

      if (!text) setInput("");
    },
    [input, isLoading, sendMessage],
  );

  // Auto-send a message when navigated from dashboard with ?q= param
  const autoSentRef = useRef(false);
  const handleSendRef = useRef(handleSend);
  useLayoutEffect(() => {
    handleSendRef.current = handleSend;
  });

  useEffect(() => {
    if (autoSend && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSendRef.current(autoSend);
    }
  }, [autoSend]);

  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {messages.length === 0 ? (
        <ChatEmptyState onSuggestionClick={(text) => handleSend(text)} />
      ) : (
        <>
          {isGuest && (
            <div className="flex justify-end px-4 pt-2">
              <Button
                onClick={handleNewChat}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="text-destructive/70 hover:text-destructive"
                aria-label={t("clearChat")}
                title={t("clearChat")}
              >
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-4" />
                {t("clearChat")}
              </Button>
            </div>
          )}
          <ChatMessageList
            messages={messages}
            status={status}
            feedbackMap={feedbackMap}
            onFeedback={handleFeedback}
            showFeedback={!isGuest}
          />
        </>
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={() => handleSend()}
        isLoading={isLoading}
      />
    </div>
  );
}
