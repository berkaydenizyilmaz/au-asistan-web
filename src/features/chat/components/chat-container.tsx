"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

export function ChatContainer() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {messages.length === 0 ? (
        <ChatEmptyState
          onSuggestionClick={(text) => sendMessage({ text })}
        />
      ) : (
        <ChatMessageList messages={messages} status={status} />
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={() => {
          if (!input.trim() || isLoading) return;
          sendMessage({ text: input });
          setInput("");
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
