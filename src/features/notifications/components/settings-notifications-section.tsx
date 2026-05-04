"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api/client";
import type { NotificationPreferences } from "@/lib/db/schema/users";

const DEFAULT_PREFS: NotificationPreferences = {
  announcements: true,
  events: true,
  calendar: true,
  calendarLeadDays: [3, 0],
};

const LEAD_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: "7 gün önce" },
  { value: 3, label: "3 gün önce" },
  { value: 1, label: "1 gün önce" },
  { value: 0, label: "Gün başında" },
];

export function SettingsNotificationsSection() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<NotificationPreferences>("/api/users/me/notification-preferences")
      .then(setPrefs)
      .catch(() => null);
  }, []);

  async function savePref(updated: NotificationPreferences) {
    setPrefs(updated);
    setSaving(true);
    try {
      await apiFetch("/api/users/me/notification-preferences", {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      toast.success("Tercihler güncellendi");
    } catch {
      toast.error("Tercihler kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  function toggleSwitch(key: keyof Omit<NotificationPreferences, "calendarLeadDays">) {
    savePref({ ...prefs, [key]: !prefs[key] });
  }

  function toggleLeadDay(day: number) {
    const current = prefs.calendarLeadDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    savePref({ ...prefs, calendarLeadDays: next });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bildirim Tercihleri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Duyuru bildirimleri</Label>
            <p className="text-xs text-muted-foreground">
              Abone olduğun kategorilerde yeni duyuru çıkınca bildir
            </p>
          </div>
          <Switch
            checked={prefs.announcements}
            onCheckedChange={() => toggleSwitch("announcements")}
            disabled={saving}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Etkinlik bildirimleri</Label>
            <p className="text-xs text-muted-foreground">
              Abone olduğun kategorilerde yeni etkinlik eklenince bildir
            </p>
          </div>
          <Switch
            checked={prefs.events}
            onCheckedChange={() => toggleSwitch("events")}
            disabled={saving}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Akademik takvim hatırlatıcıları</Label>
              <p className="text-xs text-muted-foreground">
                Akademik takvim etkinlikleri için hatırlatıcı al
              </p>
            </div>
            <Switch
              checked={prefs.calendar}
              onCheckedChange={() => toggleSwitch("calendar")}
              disabled={saving}
            />
          </div>

          {prefs.calendar && (
            <div className="ml-1 space-y-2 rounded-md border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Ne zaman hatırlat?
              </p>
              {LEAD_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`lead-${value}`}
                    checked={prefs.calendarLeadDays.includes(value)}
                    onCheckedChange={() => toggleLeadDay(value)}
                    disabled={saving}
                  />
                  <Label htmlFor={`lead-${value}`} className="font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
