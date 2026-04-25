"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

interface ReingestButtonProps {
  documentId: string;
  onReingested: () => void;
}

export function ReingestButton({ documentId, onReingested }: ReingestButtonProps) {
  const t = useTranslations("admin.rag");
  const [loading, setLoading] = useState(false);

  async function handleReingest() {
    setLoading(true);
    try {
      await apiFetch(`/api/admin/knowledge/documents/${documentId}/reingest`, {
        method: "POST",
      });
      toast.success(t("reingestSuccess"));
      onReingested();
    } catch {
      toast.error("Yeniden çekim başarısız oldu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
          <span className="sr-only">{t("reingest")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("reingest")}</AlertDialogTitle>
          <AlertDialogDescription>{t("reingestConfirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleReingest} disabled={loading}>
            {loading ? "İşleniyor..." : t("reingest")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
