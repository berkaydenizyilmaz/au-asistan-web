"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useRouter, usePathname } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { FeedbackFilters, FeedbackListItem } from "../lib/queries";

interface FeedbackTableClientProps {
  items: FeedbackListItem[];
  total: number;
  page: number;
  pageSize: number;
  filters: FeedbackFilters;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ExpandableText({ text, label }: { text: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;

  return (
    <div className="max-w-[260px]">
      <p
        className={
          expanded ? "text-sm whitespace-pre-wrap" : "text-sm line-clamp-2"
        }
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground mt-0.5"
          aria-label={label}
        >
          {expanded ? "↑" : "↓"}
        </button>
      )}
    </div>
  );
}

export function FeedbackTableClient({
  items,
  total,
  page,
  pageSize,
  filters,
}: FeedbackTableClientProps) {
  const t = useTranslations("admin.feedback");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = !!filters.rating || !!filters.onlyFallback;

  function buildUrl(overrides: {
    rating?: string;
    fallback?: string;
    page?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (overrides.rating !== undefined) {
      if (overrides.rating) params.set("rating", overrides.rating);
      else params.delete("rating");
    }
    if (overrides.fallback !== undefined) {
      if (overrides.fallback) params.set("fallback", overrides.fallback);
      else params.delete("fallback");
    }
    if (overrides.page !== undefined) {
      if (overrides.page !== "1") params.set("page", overrides.page);
      else params.delete("page");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleRatingChange(value: string) {
    router.replace(buildUrl({ rating: value === "all" ? "" : value, page: "1" }), { scroll: false });
  }

  function handleFallbackChange(checked: boolean) {
    router.replace(buildUrl({ fallback: checked ? "1" : "", page: "1" }), { scroll: false });
  }

  function handleClearFilters() {
    router.replace(pathname, { scroll: false });
  }

  function handlePage(newPage: number) {
    router.replace(buildUrl({ page: String(newPage) }), { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">{t("filterRating")}</Label>
          <Select
            value={filters.rating ?? "all"}
            onValueChange={handleRatingChange}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterRatingAll")}</SelectItem>
              <SelectItem value="up">{t("filterRatingUp")}</SelectItem>
              <SelectItem value="down">{t("filterRatingDown")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="fallback-filter"
            checked={!!filters.onlyFallback}
            onCheckedChange={handleFallbackChange}
            size="sm"
          />
          <Label htmlFor="fallback-filter" className="text-sm cursor-pointer">
            {t("filterOnlyFallback")}
          </Label>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs h-8"
          >
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm border rounded-md">
          {t("noFeedback")}
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="block mx-auto mt-2 text-xs hover:underline"
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t("tableRating")}</TableHead>
                  <TableHead>{t("tableQuestion")}</TableHead>
                  <TableHead>{t("tableAnswer")}</TableHead>
                  <TableHead className="w-[110px]">{t("tableFallback")}</TableHead>
                  <TableHead className="w-[100px]">{t("tableResponseTime")}</TableHead>
                  <TableHead className="w-[140px]">{t("tableDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.feedbackId}>
                    <TableCell>
                      <Badge
                        variant={item.rating === "up" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {item.rating === "up" ? t("ratingUp") : t("ratingDown")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.userQuestion ? (
                        <ExpandableText
                          text={item.userQuestion}
                          label={t("tableQuestion")}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {t("noQuestion")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ExpandableText
                        text={item.assistantContent}
                        label={t("tableAnswer")}
                      />
                    </TableCell>
                    <TableCell>
                      {item.hasFallback && (
                        <Badge variant="secondary" className="text-xs">
                          {t("fallbackBadge")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.responseTimeMs != null ? item.responseTimeMs : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.feedbackCreatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("pageInfo", { page, totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
              >
                {t("pagePrev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePage(page + 1)}
              >
                {t("pageNext")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
