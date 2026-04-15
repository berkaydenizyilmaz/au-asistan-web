"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, onSend, isLoading }: ChatInputProps) {
  const t = useTranslations("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          disabled={isLoading}
          rows={1}
          className="min-h-10 max-h-40 resize-none"
        />
        <Button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          aria-label={t("send")}
        >
          <HugeiconsIcon icon={SentIcon} />
        </Button>
      </div>
    </div>
  );
}
