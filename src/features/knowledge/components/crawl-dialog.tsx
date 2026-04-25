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
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";

interface DiscoveredUrl {
  url: string;
  title: string;
  unit?: string;
  shouldIndex: boolean;
}

interface CrawlDialogProps {
  onImported: () => void;
}

export function CrawlDialog({ onImported }: CrawlDialogProps) {
  const t = useTranslations("admin.rag");
  const [open, setOpen] = useState(false);
  const [rootUrl, setRootUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState("3");
  const [maxPages, setMaxPages] = useState("50");
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredUrl[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  async function handleDiscover(e: React.FormEvent) {
    e.preventDefault();
    setDiscovering(true);
    setDiscovered([]);
    setSelected(new Set());

    try {
      const result = await apiFetch<{ indexable: DiscoveredUrl[]; skipped: DiscoveredUrl[]; total: number }>(
        "/api/admin/knowledge/crawl",
        {
          method: "POST",
          body: JSON.stringify({
            rootUrl,
            maxDepth: parseInt(maxDepth),
            maxPages: parseInt(maxPages),
          }),
        }
      );
      const indexable = result.indexable ?? [];
      if (indexable.length === 0) {
        toast.info(t("crawlNoUrls"));
        return;
      }
      setDiscovered(indexable);
      setSelected(new Set(indexable.map((d) => d.url)));
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

    setImportProgress({ current: 0, total: urls.length });
    let success = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const meta = discovered.find((d) => d.url === url);
      setImportProgress({ current: i + 1, total: urls.length });

      try {
        await apiFetch("/api/admin/knowledge/ingest", {
          method: "POST",
          body: JSON.stringify({
            url,
            title: meta?.title,
            unit: meta?.unit,
          }),
        });
        success++;
      } catch {
        // skip failed URLs, continue
      }
    }

    setImportProgress(null);
    toast.success(t("crawlImportDone", { count: success }));
    setOpen(false);
    setRootUrl("");
    setDiscovered([]);
    setSelected(new Set());
    onImported();
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

  const isImporting = importProgress !== null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">{t("crawl")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("crawlDialogTitle")}</DialogTitle>
          <DialogDescription>{t("crawlDialogDescription")}</DialogDescription>
        </DialogHeader>

        {discovered.length === 0 ? (
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
                  max={100}
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
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("crawlDiscovered", { count: discovered.length })} — {selected.size} seçili
              </span>
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
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                    {item.unit && (
                      <Badge variant="secondary" className="mt-1 text-xs">{item.unit}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDiscovered([]); setSelected(new Set()); }}
              >
                Geri
              </Button>
              <Button
                onClick={handleImport}
                disabled={selected.size === 0 || isImporting}
              >
                {isImporting
                  ? t("crawlImporting", { current: importProgress!.current, total: importProgress!.total })
                  : t("crawlImport")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
