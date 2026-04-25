"use client";

import { useTranslations } from "next-intl";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import type { DocumentDTO } from "../types";
import { WatchToggle } from "./watch-toggle";
import { ReingestButton } from "./reingest-button";
import { DeleteDocumentButton } from "./delete-document-button";

interface DocumentTableProps {
  documents: DocumentDTO[];
  onRefresh: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentTable({ documents, onRefresh }: DocumentTableProps) {
  const t = useTranslations("admin.rag");

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm border rounded-md">
        {t("noDocuments")}
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">{t("tableTitle")}</TableHead>
            <TableHead>{t("tableDomain")}</TableHead>
            <TableHead>{t("tableUnit")}</TableHead>
            <TableHead>{t("tableType")}</TableHead>
            <TableHead>{t("tableLastScraped")}</TableHead>
            <TableHead>{t("tableWatched")}</TableHead>
            <TableHead className="text-right">{t("tableActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="max-w-[280px]">
                  <p className="truncate text-sm">{doc.title}</p>
                  <a
                    href={doc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline truncate block"
                  >
                    {doc.sourceUrl}
                  </a>
                </div>
              </TableCell>
              <TableCell className="text-sm">{doc.domain}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {doc.unit ?? t("noUnit")}
              </TableCell>
              <TableCell>
                <Badge variant={doc.sourceType === "pdf" ? "secondary" : "outline"} className="text-xs">
                  {doc.sourceType === "pdf" ? t("typeBadgePdf") : t("typeBadgeHtml")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(doc.lastScrapedAt)}
              </TableCell>
              <TableCell>
                <WatchToggle
                  documentId={doc.id}
                  initialIsWatched={doc.isWatched}
                  initialCheckFrequency={doc.checkFrequency}
                  initialAutoIngest={doc.autoIngest}
                  onUpdated={onRefresh}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <ReingestButton documentId={doc.id} onReingested={onRefresh} />
                  <DeleteDocumentButton documentId={doc.id} onDeleted={onRefresh} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
