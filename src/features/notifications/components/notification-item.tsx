"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "../types";

interface NotificationItemProps {
  item: NotificationDTO;
  onRead: (id: string) => void;
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function NotificationItem({ item, onRead }: NotificationItemProps) {
  const router = useRouter();
  const locale = useLocale();

  function handleClick() {
    onRead(item.id);
    if (item.type === "announcement" && item.referenceId) {
      router.push(`/${locale}/announcements`);
    } else if (item.type === "event") {
      router.push(`/${locale}/events`);
    } else if (item.type === "calendar") {
      router.push(`/${locale}/calendar`);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-accent",
        !item.isRead && "bg-accent/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug">{item.title}</span>
        {!item.isRead && (
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
      <span className="line-clamp-2 text-xs text-muted-foreground">
        {item.body}
      </span>
      <span className="mt-0.5 text-xs text-muted-foreground/70">
        {relativeTime(item.createdAt)}
      </span>
    </button>
  );
}
