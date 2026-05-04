"use client";

import type { UIMessage } from "ai";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThumbsDownIcon, ThumbsUpIcon } from "@hugeicons/core-free-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

import { cn } from "@/lib/utils";

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-2 rounded-md bg-muted/80 px-3 py-2 overflow-x-auto text-xs font-mono">
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-muted/80 px-1 py-0.5 text-xs font-mono">{children}</code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-muted-foreground/20 bg-muted/50 px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-muted-foreground/20 px-2 py-1">{children}</td>
  ),
  hr: () => <hr className="my-3 border-muted-foreground/20" />,
};

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
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md leading-relaxed whitespace-pre-wrap"
              : "bg-muted rounded-bl-md",
          )}
        >
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                if (isUser) return <span key={i}>{part.text}</span>;
                return (
                  <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {part.text}
                  </ReactMarkdown>
                );
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
