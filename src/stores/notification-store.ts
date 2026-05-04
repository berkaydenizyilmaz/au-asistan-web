import { create } from "zustand";
import type { NotificationDTO } from "@/features/notifications/types";

interface NotificationState {
  unreadCount: number;
  recentItems: NotificationDTO[];
  setUnreadCount: (n: number) => void;
  decrementUnread: () => void;
  setRecentItems: (items: NotificationDTO[]) => void;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  recentItems: [],
  setUnreadCount: (n) => set({ unreadCount: n }),
  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  setRecentItems: (items) => set({ recentItems: items }),
  markRead: (id) =>
    set((state) => ({
      recentItems: state.recentItems.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
    })),
}));
