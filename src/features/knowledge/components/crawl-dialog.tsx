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
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api/client";

interface DiscoveredUrl {
  url: string;
  title: string;
  unit?: string;
  shouldIndex: boolean;
}

interface CrawlResponse {
  indexable: DiscoveredUrl[];
  skipped: DiscoveredUrl[];
  total: number;
  limitReached: boolean;
  totalEligible: number;
}

interface CrawlDialogProps {
  onImported: () => void;
}

export function CrawlDialog({ onImported }: CrawlDialogProps) {
  const t = useTranslations("admin.rag");
  const [open, setOpen] = useState(false);
  const [rootUrl, setRootUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState("3");
  const [maxPages, setMaxPages] = useState("100");
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredUrl[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limitReached, setLimitReached] = useState(false);
  const [totalEligible, setTotalEligible] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    saved: number;
    updated: number;
  } | null>(null);

  function updateDiscovered(url: string, patch: Partial<DiscoveredUrl>) {
    setDiscovered((prev) =>
      prev.map((d) => (d.url === url ? { ...d, ...patch } : d)),
    );
  }

  async function handleDiscover(e: React.FormEvent) {
    e.preventDefault();
    setDiscovering(true);
    setDiscovered([]);
    setSelected(new Set());
    setLimitReached(false);

    try {
      const result = await apiFetch<CrawlResponse>("/api/admin/knowledge/crawl", {
        method: "POST",
        body: JSON.stringify({
          rootUrl,
          maxDepth: parseInt(maxDepth),
          maxPages: parseInt(maxPages),
        }),
      });

      const indexable = result.indexable ?? [];
      if (indexable.length === 0) {
        toast.info(t("crawlNoUrls"));
        return;
      }

      setDiscovered(indexable);
      setSelected(new Set(indexable.map((d) => d.url)));
      setLimitReached(result.limitReached ?? false);
      setTotalEligible(result.totalEligible ?? indexable.length);
      toast.success(t("crawlDiscovered", { count: indexable.length }));
    } catch {
      toast.error("Keşif başarısız oldu.");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleImport() {
    const urls = Array.from(selected);
    if (urls.length === 0) return;

    setImporting(true);
    try {
      const payload = urls.map((url) => {
        const meta = discovered.find((d) => d.url === url)!;
        return { url, title: meta.title, unit: meta.unit };
      });

      const result = await apiFetch<{ saved: number; updated: number }>(
        "/api/admin/knowledge/documents/bulk",
        {
          method: "POST",
          body: JSON.stringify({ documents: payload }),
        },
      );

      setImportResult(result);
      onImported();
    } catch {
      toast.error("Kayıt başarısız oldu.");
    } finally {
      setImporting(false);
    }
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelected(new Set(discovered.map((d) => d.url)));
    } else {
      setSelected(new Set());
    }
  }

  function toggleUrl(url: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(url);
    else next.delete(url);
    setSelected(next);
  }

  function handleClose() {
    setImportResult(null);
    setRootUrl("");
    setDiscovered([]);
    setSelected(new Set());
    setLimitReached(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">{t("crawl")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("crawlDialogTitle")}</DialogTitle>
          <DialogDescription>{t("crawlDialogDescription")}</DialogDescription>
        </DialogHeader>

        {importResult !== null ? (
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="space-y-2">
              {importResult.saved > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-green-600">{importResult.saved} URL</span> bilgi tabanına eklendi.
                </p>
              )}
              {importResult.updated > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-muted-foreground">{importResult.updated} URL</span> zaten mevcuttu, başlık/birim güncellendi.
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                İçerik ekleme (chunking) için listeden her kaydın yanındaki &quot;Yeniden İşle&quot; butonunu kullanabilirsin.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Kapat</Button>
            </DialogFooter>
          </div>
        ) : discovered.length === 0 ? (
          <form onSubmit={handleDiscover} className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="crawl-url">{t("crawlRootUrlLabel")}</Label>
              <Input
                id="crawl-url"
                type="url"
                placeholder={t("crawlRootUrlPlaceholder")}
                value={rootUrl}
                onChange={(e) => setRootUrl(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-depth">{t("crawlMaxDepthLabel")}</Label>
                <Input
                  id="max-depth"
                  type="number"
                  min={1}
                  max={5}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-pages">{t("crawlMaxPagesLabel")}</Label>
                <Input
                  id="max-pages"
                  type="number"
                  min={1}
                  max={500}
                  value={maxPages}
                  onChange={(e) => setMaxPages(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={discovering || !rootUrl}>
                {discovering ? "Keşfediliyor..." : t("crawlDiscover")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm text-muted-foreground">
                  {t("crawlDiscovered", { count: discovered.length })} — {selected.size} seçili
                </span>
                {limitReached && (
                  <p className="text-xs text-amber-600">
                    Sitemap&apos;ta {totalEligible} uygun sayfa var; yalnızca {discovered.length} tanesi keşfedildi. Daha fazlası için sayfa limitini artırın.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selected.size === discovered.length}
                  onCheckedChange={(c) => toggleAll(c === true)}
                />
                <Label htmlFor="select-all" className="text-sm">{t("crawlSelectAll")}</Label>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 border rounded-md divide-y">
              {discovered.map((item) => (
                <div key={item.url} className="flex items-start gap-3 p-3">
                  <Checkbox
                    id={`url-${item.url}`}
                    checked={selected.has(item.url)}
                    onCheckedChange={(c) => toggleUrl(item.url, c === true)}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      className="text-sm font-medium w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none truncate"
                      value={item.title}
                      onChange={(e) => updateDiscovered(item.url, { title: e.target.value })}
                      aria-label="Başlık"
                    />
                    <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                    <input
                      className="text-xs w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-muted-foreground"
                      placeholder="Birim (örn: Mühendislik Fakültesi)"
                      value={item.unit ?? ""}
                      onChange={(e) => updateDiscovered(item.url, { unit: e.target.value || undefined })}
                      aria-label="Birim"
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDiscovered([]); setSelected(new Set()); setLimitReached(false); }}
                disabled={importing}
              >
                Geri
              </Button>
              <Button onClick={handleImport} disabled={selected.size === 0 || importing}>
                {importing ? "Kaydediliyor..." : `${selected.size} URL Kaydet`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
