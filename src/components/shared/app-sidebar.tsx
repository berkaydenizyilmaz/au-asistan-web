"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home03Icon,
  Restaurant01Icon,
  Calendar03Icon,
  Megaphone01Icon,
  Calendar01Icon,
  Settings02Icon,
  Add01Icon,
  Login01Icon,
  Logout01Icon,
  ChevronsUpDown,
} from "@hugeicons/core-free-icons";

import { toast } from "sonner";

import { Link, usePathname } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { signOut } from "@/features/auth/lib/auth-actions";
import { logger } from "@/lib/logger";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { key: "home", href: "/", icon: Home03Icon },
  { key: "calendar", href: "/calendar", icon: Calendar03Icon },
  { key: "meals", href: "/meals", icon: Restaurant01Icon },
  { key: "announcements", href: "/announcements", icon: Megaphone01Icon },
  { key: "events", href: "/events", icon: Calendar01Icon },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { closeMobileOnly } = useSidebar();

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    closeMobileOnly();
  }, [pathname, closeMobileOnly]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={tc("appName")}>
              <Link href="/">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                  AÜ
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">
                    {tc("appName")}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {tc("appDescription")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                    tooltip={t(item.key)}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>{t("chatHistory")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t("newChat")}>
                      <Link href="/chat">
                        <HugeiconsIcon icon={Add01Icon} />
                        <span>{t("newChat")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoading ? null : user ? (
              <UserDropdown />
            ) : (
              <SidebarMenuButton asChild tooltip={t("login")} className="justify-center">
                <Link href="/login">
                  <HugeiconsIcon icon={Login01Icon} />
                  <span>{t("login")}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function UserDropdown() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations("nav");

  async function handleLogout() {
    const { error } = await signOut();
    if (error) {
      logger.error("Logout failed", error.message);
      toast.error(t("logoutFailed"));
    }
  }

  const displayName =
    user?.user_metadata?.full_name || user?.email || "";
  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {initial}
          </div>
          <div className="flex min-w-0 flex-1 flex-col text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            {user?.user_metadata?.full_name && (
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
          <HugeiconsIcon icon={ChevronsUpDown} className="shrink-0 size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-popper-anchor-width]"
        align="start"
        side="top"
      >
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <HugeiconsIcon icon={Settings02Icon} />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <HugeiconsIcon icon={Logout01Icon} />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
