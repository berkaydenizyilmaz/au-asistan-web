"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api/client";
import { logger } from "@/lib/logger";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { ConversationDTO } from "../types";

export function ChatHistoryList() {
  const t = useTranslations("chat");
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);

  useEffect(() => {
    let cancelled = false;

    apiFetch<ConversationDTO[]>("/api/conversations")
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .catch((error) => {
        logger.error("Failed to fetch conversations", error);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (pathname === `/chat/${id}`) {
        router.replace("/chat");
      }
    } catch (error) {
      logger.error("Failed to delete conversation", error);
    }
  }

  if (conversations.length === 0) return null;

  return (
    <SidebarMenu>
      {conversations.map((conversation) => (
        <SidebarMenuItem key={conversation.id}>
          <SidebarMenuButton
            asChild
            isActive={pathname === `/chat/${conversation.id}`}
            tooltip={conversation.title ?? t("untitled")}
          >
            <Link href={`/chat/${conversation.id}`}>
              <span className="truncate">
                {conversation.title ?? t("untitled")}
              </span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuAction
            onClick={() => handleDelete(conversation.id)}
            showOnHover
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          </SidebarMenuAction>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
