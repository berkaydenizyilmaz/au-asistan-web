"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home03Icon,
  Database01Icon,
  ChartHistogramIcon,
  MessageMultiple01Icon,
  UserGroupIcon,
  Clock01Icon,
  ArrowLeft01Icon,
  Logout01Icon,
  Settings02Icon,
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
  { key: "dashboard", href: "/admin", icon: Home03Icon, exact: true },
  { key: "rag", href: "/admin/rag", icon: Database01Icon },
  { key: "analytics", href: "/admin/analytics", icon: ChartHistogramIcon },
  { key: "feedback", href: "/admin/feedback", icon: MessageMultiple01Icon },
  { key: "users", href: "/admin/users", icon: UserGroupIcon },
  { key: "cron", href: "/admin/cron", icon: Clock01Icon },
] as const;

export function AdminSidebar() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { closeMobileOnly } = useSidebar();

  useEffect(() => {
    closeMobileOnly();
  }, [pathname, closeMobileOnly]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="AÜ Admin">
              <Link href="/admin">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-destructive text-destructive-foreground text-sm font-bold">
                  ADM
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">AÜ Admin</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Yönetim Paneli
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
                      "exact" in item && item.exact
                        ? pathname === "/admin"
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("backToApp")}>
                  <Link href="/">
                    <HugeiconsIcon icon={ArrowLeft01Icon} />
                    <span>{t("backToApp")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {!isLoading && user && <AdminUserDropdown />}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminUserDropdown() {
  const user = useAuthStore((s) => s.user);
  const te = useTranslations("errors");

  async function handleLogout() {
    const { error } = await signOut();
    if (error) {
      logger.error("Logout failed", error.message);
      toast.error(te.has(error.code) ? te(error.code) : "Çıkış yapılamadı");
    }
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "";
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
            Ayarlar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <HugeiconsIcon icon={Logout01Icon} />
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
