"use client";

import { useEffect, useState } from "react";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/stores/notification-store";
import {
  fetchRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useNotificationPolling,
} from "../hooks/use-notifications";
import type { NotificationDTO } from "../types";
import { NotificationItem } from "./notification-item";

export function NotificationBell() {
  useNotificationPolling();

  const { unreadCount, recentItems, setRecentItems, setUnreadCount, markRead } =
    useNotificationStore();

  const [open, setOpen] = useState(false);
  const [bellLoaded, setBellLoaded] = useState(false);

  useEffect(() => {
    if (!open || bellLoaded) return;
    fetchRecentNotifications()
      .then((items) => {
        setRecentItems(items);
        setBellLoaded(true);
      })
      .catch(() => setBellLoaded(true));
  }, [open, bellLoaded, setRecentItems]);

  async function handleRead(id: string) {
    const item = recentItems.find((n) => n.id === id);
    if (!item || item.isRead) return;
    markRead(id);
    setUnreadCount(Math.max(0, unreadCount - 1));
    await markNotificationRead(id).catch(() => null);
  }

  async function handleMarkAll() {
    setRecentItems(recentItems.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead().catch(() => null);
  }

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Bildirimler">
          <HugeiconsIcon icon={Notification02Icon} className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {badgeLabel}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Bildirimler</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Tümünü oku
            </button>
          )}
        </div>

        <div className="max-h-90 overflow-y-auto">
          {!bellLoaded ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          ) : recentItems.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Henüz bildirim yok
            </div>
          ) : (
            recentItems.map((item: NotificationDTO) => (
              <NotificationItem key={item.id} item={item} onRead={handleRead} />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
