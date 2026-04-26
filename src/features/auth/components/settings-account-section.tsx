"use client";

import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

import { DeleteAccountDialog } from "./delete-account-dialog";

export function SettingsAccountSection() {
  const t = useTranslations("settings.account");
  const user = useAuthStore((s) => s.user);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t("email")}</p>
          <p className="text-sm font-medium">{user?.email ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t("name")}</p>
          <p className="text-sm font-medium">
            {(user?.user_metadata?.full_name as string | undefined) ?? "—"}
          </p>
        </div>
        <div className="pt-2 border-t">
          <DeleteAccountDialog />
        </div>
      </CardContent>
    </Card>
  );
}
