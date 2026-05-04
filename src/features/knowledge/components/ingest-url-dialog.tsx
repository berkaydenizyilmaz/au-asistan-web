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
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

interface PreviewData {
  suggestedTitle: string;
  suggestedUnit: string | null;
  sourceType: "html" | "pdf";
  contentLength: number;
}

interface IngestUrlDialogProps {
  onIngested: () => void;
}

export function IngestUrlDialog({ onIngested }: IngestUrlDialogProps) {
  const t = useTranslations("admin.rag");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<"form" | "preview">("form");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  function resetState() {
    setUrl("");
    setStep("form");
    setPreview(null);
    setTitle("");
    setUnit("");
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetState();
  }

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setPreviewing(true);
    try {
      const data = await apiFetch<PreviewData>("/api/admin/knowledge/preview", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      setPreview(data);
      setTitle(data.suggestedTitle);
      setUnit(data.suggestedUnit ?? "");
      setStep("preview");
    } catch {
      toast.error("URL önizlenemedi. Adresin erişilebilir olduğundan emin olun.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleIngest() {
    if (!url || !preview) return;

    setIngesting(true);
    try {
      await apiFetch("/api/admin/knowledge/ingest", {
        method: "POST",
        body: JSON.stringify({ url, title: title || undefined, unit: unit || undefined }),
      });
      toast.success(t("ingestSuccess"));
      handleOpenChange(false);
      onIngested();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "CONFLICT") {
        toast.error("Bu URL zaten bilgi tabanında mevcut.");
      } else {
        toast.error("URL eklenemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setIngesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">{t("addUrl")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("ingestDialogTitle")}</DialogTitle>
              <DialogDescription>{t("ingestDialogDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePreview} className="space-y-4">
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={previewing || !url}>
                  {previewing ? "Önizleniyor..." : "Önizle →"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>İçerik Önizlemesi</DialogTitle>
              <DialogDescription className="truncate text-xs">{url}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={preview?.sourceType === "pdf" ? "secondary" : "outline"} className="text-xs">
                  {preview?.sourceType?.toUpperCase()}
                </Badge>
                <span>{preview?.contentLength.toLocaleString("tr-TR")} karakter</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-title">{t("ingestTitleLabel")}</Label>
                <Input
                  id="preview-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("ingestTitlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-unit">{t("ingestUnitLabel")}</Label>
                <Input
                  id="preview-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={t("ingestUnitPlaceholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("form")}
                disabled={ingesting}
              >
                ← Geri
              </Button>
              <Button onClick={handleIngest} disabled={ingesting || !title}>
                {ingesting ? "Ekleniyor..." : t("ingestSubmit")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
