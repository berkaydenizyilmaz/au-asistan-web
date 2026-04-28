"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter, usePathname } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api/client";

import type { AdminUserListItem } from "../lib/queries";

interface UsersTableClientProps {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  currentUserId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DeleteUserButton({
  userId,
  userName,
  onDeleted,
  t,
}: {
  userId: string;
  userName: string;
  onDeleted: () => void;
  t: ReturnType<typeof useTranslations<"admin.users">>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      toast.success(t("deleteSuccess", { name: userName }));
      onDeleted();
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 text-xs">
          {t("deleteAction")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteAction")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteConfirm", { name: userName })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t("deleting") : t("deleteAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UsersTableClient({
  items,
  total,
  page,
  pageSize,
  currentUserId,
}: UsersTableClientProps) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loadingRoleFor, setLoadingRoleFor] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildUrl(overrides: { page?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (overrides.page !== undefined) {
      if (overrides.page !== "1") params.set("page", overrides.page);
      else params.delete("page");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setLoadingRoleFor(userId);
    try {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(t("roleChangeSuccess"));
      router.refresh();
    } catch {
      toast.error(t("roleChangeFailed"));
    } finally {
      setLoadingRoleFor(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border rounded-md">
          {t("noUsers")}
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableName")}</TableHead>
                  <TableHead>{t("tableEmail")}</TableHead>
                  <TableHead className="w-[140px]">{t("tableRole")}</TableHead>
                  <TableHead className="w-[120px]">{t("tableCreated")}</TableHead>
                  <TableHead className="w-[120px]">{t("tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                            {user.role === "admin" ? t("roleAdmin") : t("roleUser")}
                          </Badge>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(val) => handleRoleChange(user.id, val)}
                            disabled={loadingRoleFor === user.id}
                          >
                            <SelectTrigger className="h-7 text-xs w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">{t("roleUser")}</SelectItem>
                              <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <span
                            className="text-xs text-muted-foreground"
                            title={t("selfActionDisabled")}
                          >
                            {t("selfActionDisabled")}
                          </span>
                        ) : (
                          <DeleteUserButton
                            userId={user.id}
                            userName={user.name}
                            onDeleted={() => router.refresh()}
                            t={t}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("pageInfo", { page, totalPages })}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  router.replace(buildUrl({ page: String(page - 1) }), { scroll: false })
                }
              >
                {t("pagePrev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  router.replace(buildUrl({ page: String(page + 1) }), { scroll: false })
                }
              >
                {t("pageNext")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
