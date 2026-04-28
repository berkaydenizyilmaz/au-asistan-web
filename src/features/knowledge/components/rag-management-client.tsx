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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <IngestUrlDialog onIngested={refresh} />
        <CrawlDialog onImported={refresh} />
        <Button
          size="sm"
          variant="outline"
          onClick={checkWatched}
          disabled={checkingWatched}
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-4 mr-1" />
          {checkingWatched ? "Kontrol ediliyor..." : t("checkWatched")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={refresh}
          disabled={refreshing}
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-4" />
          <span className="sr-only">Yenile</span>
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {documents.length} döküman
        </span>
      </div>

      <DocumentTable documents={documents} onRefresh={refresh} />
    </div>
  );
}
