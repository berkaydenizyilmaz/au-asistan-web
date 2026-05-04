"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

import type { DocumentDTO } from "../types";
import { DocumentTable } from "./document-table";
import { IngestUrlDialog } from "./ingest-url-dialog";
import { CrawlDialog } from "./crawl-dialog";

interface RagManagementClientProps {
  initialDocuments: DocumentDTO[];
}

export function RagManagementClient({ initialDocuments }: RagManagementClientProps) {
  const t = useTranslations("admin.rag");
  const [documents, setDocuments] = useState<DocumentDTO[]>(initialDocuments);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingWatched, setCheckingWatched] = useState(false);
  const [processProgress, setProcessProgress] = useState<{ current: number; total: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pendingCount = documents.filter((d) => d.lastScrapedAt === null).length;
  const isProcessing = processProgress !== null;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelected(checked ? new Set(documents.map((d) => d.id)) : new Set());
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const data = await apiFetch<DocumentDTO[]>("/api/admin/knowledge/documents");
      setDocuments(data ?? []);
    } catch {
      toast.error("Liste güncellenemedi.");
    } finally {
      setRefreshing(false);
    }
  }

  async function checkWatched() {
    setCheckingWatched(true);
    try {
      await apiFetch("/api/admin/knowledge/check-watched", { method: "POST" });
      toast.success(t("checkWatchedSuccess"));
      await refresh();
    } catch {
      toast.error("Kontrol başarısız oldu.");
    } finally {
      setCheckingWatched(false);
    }
  }

  async function processDocuments(ids: string[]) {
    if (ids.length === 0) return;

    setProcessProgress({ current: 0, total: ids.length });
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      setProcessProgress({ current: i + 1, total: ids.length });
      try {
        await apiFetch(`/api/admin/knowledge/documents/${ids[i]}/reingest`, { method: "POST" });
        succeeded++;
      } catch {
        failed++;
      }
    }

    setProcessProgress(null);
    setSelected(new Set());
    await refresh();
    if (failed === 0) {
      toast.success(`${succeeded} döküman başarıyla işlendi.`);
    } else {
      toast.warning(`${succeeded} başarılı, ${failed} başarısız.`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <IngestUrlDialog onIngested={refresh} />
        <CrawlDialog onImported={refresh} />
        {isProcessing ? (
          <Button size="sm" variant="outline" disabled className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800">
            İşleniyor {processProgress.current}/{processProgress.total}...
          </Button>
        ) : selected.size > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => processDocuments(Array.from(selected))}
            className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950"
          >
            {selected.size} seçiliyi işle
          </Button>
        ) : pendingCount > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => processDocuments(documents.filter((d) => d.lastScrapedAt === null).map((d) => d.id))}
            className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950"
          >
            {pendingCount} bekleyeni işle
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          onClick={checkWatched}
          disabled={checkingWatched || isProcessing}
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-4 mr-1" />
          {checkingWatched ? "Kontrol ediliyor..." : t("checkWatched")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={refresh}
          disabled={refreshing || isProcessing}
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          <span className="sr-only">Yenile</span>
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {documents.length} döküman
        </span>
      </div>

      <DocumentTable
        documents={documents}
        onRefresh={refresh}
        selected={selected}
        onToggle={toggleSelect}
        onToggleAll={toggleSelectAll}
      />
    </div>
  );
}
