"use client";

import { useCallback, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/client";
import { useNotificationStore } from "@/stores/notification-store";
import type { NotificationDTO } from "../types";

const POLL_INTERVAL_MS = 30_000;

export function useNotificationPolling() {
  const { setUnreadCount } = useNotificationStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ count: number }>("/api/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {
      // silently ignore — user may be logged out or offline
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchUnreadCount();

    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchUnreadCount]);
}

export async function fetchRecentNotifications(): Promise<NotificationDTO[]> {
  return apiFetch<NotificationDTO[]>("/api/notifications/recent");
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<{ count: number }>("/api/notifications/mark-all-read", {
    method: "POST",
  });
}
