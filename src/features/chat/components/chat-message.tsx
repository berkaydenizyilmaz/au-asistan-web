"use client";

import type { UIMessage } from "ai";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          AÜ
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return <span key={i}>{part.text}</span>;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
