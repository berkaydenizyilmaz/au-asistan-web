"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";

interface WatchToggleProps {
  documentId: string;
  initialIsWatched: boolean;
  initialCheckFrequency: string | null;
  initialAutoIngest: boolean;
  onUpdated?: () => void;
}

export function WatchToggle({
  documentId,
  initialIsWatched,
  initialCheckFrequency,
  initialAutoIngest,
  onUpdated,
}: WatchToggleProps) {
  const t = useTranslations("admin.rag");
  const [isWatched, setIsWatched] = useState(initialIsWatched);
  const [checkFrequency, setCheckFrequency] = useState<string | null>(initialCheckFrequency);
  const [autoIngest, setAutoIngest] = useState(initialAutoIngest);
  const [saving, setSaving] = useState(false);

  async function save(overrides?: Partial<{ isWatched: boolean; checkFrequency: string | null; autoIngest: boolean }>) {
    setSaving(true);
    const payload = {
      isWatched: overrides?.isWatched ?? isWatched,
      checkFrequency: overrides !== undefined && "checkFrequency" in overrides
        ? overrides.checkFrequency
        : checkFrequency,
      autoIngest: overrides?.autoIngest ?? autoIngest,
    };
    try {
      await apiFetch(`/api/admin/knowledge/documents/${documentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success(t("watchSaveSuccess"));
      onUpdated?.();
    } catch {
      toast.error("Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  function handleWatchedChange(checked: boolean) {
    setIsWatched(checked);
    save({ isWatched: checked });
  }

  return (
    <div className="space-y-3 min-w-[180px]">
      <div className="flex items-center gap-2">
        <Switch
          checked={isWatched}
          onCheckedChange={handleWatchedChange}
          disabled={saving}
        />
      </div>

      {isWatched && (
        <div className="space-y-2 pl-1">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">{t("watchToggleFrequency")}</Label>
            <Select
              value={checkFrequency ?? ""}
              onValueChange={(v) => {
                setCheckFrequency(v);
                save({ checkFrequency: v });
              }}
              disabled={saving}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("watchFrequencyDaily")}</SelectItem>
                <SelectItem value="weekly">{t("watchFrequencyWeekly")}</SelectItem>
                <SelectItem value="monthly">{t("watchFrequencyMonthly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`auto-${documentId}`}
              checked={autoIngest}
              onCheckedChange={(checked) => {
                const val = checked === true;
                setAutoIngest(val);
                save({ autoIngest: val });
              }}
              disabled={saving}
            />
            <Label htmlFor={`auto-${documentId}`} className="text-xs">
              {t("watchToggleAutoIngest")}
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
