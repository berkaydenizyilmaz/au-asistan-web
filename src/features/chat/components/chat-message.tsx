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
    </div>
  );
}
