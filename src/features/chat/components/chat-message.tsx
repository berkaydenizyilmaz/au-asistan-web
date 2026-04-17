"use client";

import type { UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThumbsDownIcon, ThumbsUpIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: UIMessage;
  feedback?: "like" | "dislike" | null;
  onFeedback?: (rating: "like" | "dislike") => void;
  showFeedback?: boolean;
}

export function ChatMessage({
  message,
  feedback,
  onFeedback,
  showFeedback,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const t = useTranslations("chat");

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          AÜ
        </div>
      )}
      <div className={cn("flex flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
          )}
        >
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <span key={i}>{part.text}</span>;
              default:
                if (part.type.startsWith("tool-")) {
                  const toolPart = part as { type: string; state: string };
                  if (toolPart.state === "input-available") {
                    return (
                      <div key={i} className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground">
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                        Bilgi aranıyor...
                      </div>
                    );
                  }
                }
                return null;
            }
          })}
        </div>

        {showFeedback && !isUser && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onFeedback?.("like")}
              className={cn(
                "rounded p-1 transition-colors",
                feedback === "like"
                  ? "text-primary"
                  : "text-muted-foreground/40 hover:text-muted-foreground",
              )}
              aria-label={t("feedbackLike")}
            >
              <HugeiconsIcon icon={ThumbsUpIcon} className="size-3.5" />
            </button>
            <button
              onClick={() => onFeedback?.("dislike")}
              className={cn(
                "rounded p-1 transition-colors",
                feedback === "dislike"
                  ? "text-destructive"
                  : "text-muted-foreground/40 hover:text-muted-foreground",
              )}
              aria-label={t("feedbackDislike")}
            >
              <HugeiconsIcon icon={ThumbsDownIcon} className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
