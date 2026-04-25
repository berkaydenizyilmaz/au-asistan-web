"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";

interface IngestUrlDialogProps {
  onIngested: () => void;
}

export function IngestUrlDialog({ onIngested }: IngestUrlDialogProps) {
  const t = useTranslations("admin.rag");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      await apiFetch("/api/admin/knowledge/ingest", {
        method: "POST",
        body: JSON.stringify({
          url,
          title: title || undefined,
          unit: unit || undefined,
        }),
      });
      toast.success(t("ingestSuccess"));
      setOpen(false);
      setUrl("");
      setTitle("");
      setUnit("");
      onIngested();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "CONFLICT") {
        toast.error("Bu URL zaten bilgi tabanında mevcut.");
      } else {
        toast.error("URL eklenemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("addUrl")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ingestDialogTitle")}</DialogTitle>
          <DialogDescription>{t("ingestDialogDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingest-url">{t("ingestUrlLabel")}</Label>
            <Input
              id="ingest-url"
              type="url"
              placeholder={t("ingestUrlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ingest-title">{t("ingestTitleLabel")}</Label>
            <Input
              id="ingest-title"
              placeholder={t("ingestTitlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ingest-unit">{t("ingestUnitLabel")}</Label>
            <Input
              id="ingest-unit"
              placeholder={t("ingestUnitPlaceholder")}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading || !url}>
              {loading ? "Ekleniyor..." : t("ingestSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
