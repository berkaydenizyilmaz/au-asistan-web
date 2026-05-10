"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api/client";

import type { DocumentDTO } from "../types";
import { WatchToggle } from "./watch-toggle";
import { ReingestButton } from "./reingest-button";
import { DeleteDocumentButton } from "./delete-document-button";

interface DocumentTableProps {
  documents: DocumentDTO[];
  onRefresh: () => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

interface EditingCell {
  id: string;
  field: "title" | "unit";
  value: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentTable({ documents, onRefresh, selected, onToggle, onToggleAll }: DocumentTableProps) {
  const t = useTranslations("admin.rag");
  const allSelected = documents.length > 0 && selected.size === documents.length;
  const someSelected = selected.size > 0 && !allSelected;
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(doc: DocumentDTO, field: "title" | "unit") {
    setEditing({ id: doc.id, field, value: field === "title" ? doc.title : (doc.unit ?? "") });
  }

  async function commitEdit() {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/knowledge/documents/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [editing.field]: editing.value || null }),
      });
      onRefresh();
    } catch {
      toast.error("Güncelleme başarısız.");
    } finally {
      setSaving(false);
      setEditing(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(null);
  }

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
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected || (someSelected ? "indeterminate" : false)}
                onCheckedChange={(c) => onToggleAll(c === true)}
                aria-label="Tümünü seç"
              />
            </TableHead>
            <TableHead className="min-w-50">{t("tableTitle")}</TableHead>
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
            <TableRow key={doc.id} data-selected={selected.has(doc.id)} className="data-[selected=true]:bg-muted/50">
              <TableCell>
                <Checkbox
                  checked={selected.has(doc.id)}
                  onCheckedChange={() => onToggle(doc.id)}
                  aria-label={doc.title}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="max-w-70">
                  {editing?.id === doc.id && editing.field === "title" ? (
                    <input
                      autoFocus
                      className="w-full text-sm bg-transparent border-b border-primary outline-none"
                      value={editing.value}
                      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      disabled={saving}
                    />
                  ) : (
                    <p
                      className="truncate text-sm cursor-pointer hover:text-primary"
                      title="Düzenlemek için tıkla"
                      onClick={() => startEdit(doc, "title")}
                    >
                      {doc.title}
                    </p>
                  )}
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
                {editing?.id === doc.id && editing.field === "unit" ? (
                  <input
                    autoFocus
                    className="w-full text-sm bg-transparent border-b border-primary outline-none"
                    value={editing.value}
                    placeholder="Birim yok"
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onBlur={commitEdit}
                    onKeyDown={handleKeyDown}
                    disabled={saving}
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:text-primary"
                    title="Düzenlemek için tıkla"
                    onClick={() => startEdit(doc, "unit")}
                  >
                    {doc.unit ?? <span className="italic opacity-50">{t("noUnit")}</span>}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={doc.sourceType === "pdf" ? "secondary" : "outline"} className="text-xs">
                  {doc.sourceType === "pdf" ? t("typeBadgePdf") : t("typeBadgeHtml")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {doc.lastScrapedAt ? (
                  formatDate(doc.lastScrapedAt)
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Bekliyor
                  </span>
                )}
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
