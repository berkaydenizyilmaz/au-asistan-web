"use client";

import { useTranslations } from "next-intl";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useAuthStore } from "@/stores/auth-store";

export function AppHeader() {
  const t = useTranslations("nav");
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger aria-label={t("toggleSidebar")} />

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <LocaleToggle />
        <ThemeToggle />
        {user && <NotificationBell />}
      </div>
    </header>
  );
}
