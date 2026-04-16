export interface ConversationDTO {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: unknown | null;
  createdAt: string;
}

export interface ConversationWithMessagesDTO extends ConversationDTO {
  messages: MessageDTO[];
}
