"use client";

import { useEffect, useState } from "react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api/client";
import type { SubscriptionDTO } from "../types";

export function SettingsSubscriptionsSection() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [announcementInput, setAnnouncementInput] = useState("");
  const [eventInput, setEventInput] = useState("");
  const [announcementSuggestions, setAnnouncementSuggestions] = useState<string[]>([]);
  const [eventSuggestions, setEventSuggestions] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<SubscriptionDTO[]>("/api/users/me/subscriptions")
      .then(setSubscriptions)
      .catch(() => null);
    apiFetch<string[]>("/api/notifications/categories?type=announcement")
      .then(setAnnouncementSuggestions)
      .catch(() => null);
    apiFetch<string[]>("/api/notifications/categories?type=event")
      .then(setEventSuggestions)
      .catch(() => null);
  }, []);

  async function addSubscription(type: "announcement" | "event", category: string) {
    const trimmed = category.trim();
    if (!trimmed) return;

    const alreadyExists = subscriptions.some(
      (s) => s.type === type && s.category === trimmed,
    );
    if (alreadyExists) {
      toast.error("Bu kategoriye zaten abonesin");
      return;
    }

    try {
      const sub = await apiFetch<SubscriptionDTO>("/api/users/me/subscriptions", {
        method: "POST",
        body: JSON.stringify({ type, category: trimmed }),
      });
      setSubscriptions((prev) => [...prev, sub]);
      if (type === "announcement") setAnnouncementInput("");
      else setEventInput("");
      toast.success("Abonelik eklendi");
    } catch {
      toast.error("Abonelik eklenemedi");
    }
  }

  async function removeSubscription(id: string) {
    try {
      await apiFetch(`/api/users/me/subscriptions/${id}`, { method: "DELETE" });
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Abonelik kaldırıldı");
    } catch {
      toast.error("Abonelik kaldırılamadı");
    }
  }

  const announcementSubs = subscriptions.filter((s) => s.type === "announcement");
  const eventSubs = subscriptions.filter((s) => s.type === "event");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonelikler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <SubscriptionGroup
          label="Duyuru kategorileri"
          description="Hangi birim veya fakültenin duyurularını almak istiyorsun?"
          input={announcementInput}
          onInputChange={setAnnouncementInput}
          suggestions={announcementSuggestions}
          subscriptions={announcementSubs}
          onAdd={(cat) => addSubscription("announcement", cat)}
          onRemove={removeSubscription}
          placeholder="Örn: Mühendislik Fakültesi"
        />

        <Separator />

        <SubscriptionGroup
          label="Etkinlik kategorileri"
          description="Hangi kategorideki etkinlikleri takip etmek istiyorsun?"
          input={eventInput}
          onInputChange={setEventInput}
          suggestions={eventSuggestions}
          subscriptions={eventSubs}
          onAdd={(cat) => addSubscription("event", cat)}
          onRemove={removeSubscription}
          placeholder="Örn: Konferans"
        />
      </CardContent>
    </Card>
  );
}

interface SubscriptionGroupProps {
  label: string;
  description: string;
  input: string;
  onInputChange: (v: string) => void;
  suggestions: string[];
  subscriptions: SubscriptionDTO[];
  onAdd: (category: string) => void;
  onRemove: (id: string) => void;
  placeholder: string;
}

function SubscriptionGroup({
  label,
  description,
  input,
  onInputChange,
  suggestions,
  subscriptions,
  onAdd,
  onRemove,
  placeholder,
}: SubscriptionGroupProps) {
  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !subscriptions.some((sub) => sub.category === s),
  );

  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd(input);
              }
            }}
            list={`suggestions-${label}`}
          />
          <datalist id={`suggestions-${label}`}>
            {filtered.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAdd(input)}
          disabled={!input.trim()}
        >
          Ekle
        </Button>
      </div>

      {subscriptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {subscriptions.map((sub) => (
            <Badge key={sub.id} variant="secondary" className="gap-1 pr-1">
              {sub.category}
              <button
                onClick={() => onRemove(sub.id)}
                className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                aria-label={`${sub.category} aboneliğini kaldır`}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Henüz abonelik yok</p>
      )}
    </div>
  );
}
