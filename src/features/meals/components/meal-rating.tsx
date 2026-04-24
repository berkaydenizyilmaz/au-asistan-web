"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThumbsUpIcon, ThumbsDownIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch, ApiClientError } from "@/lib/api/client";

import type { RatingSummary } from "../types";

interface MealRatingProps {
  mealId: string;
  isToday: boolean;
  initialData?: RatingSummary;
}

export function MealRating({ mealId, isToday, initialData }: MealRatingProps) {
  const t = useTranslations("meals");
  const te = useTranslations("errors");
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<RatingSummary | null>(initialData ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showError(err: unknown) {
    const code = err instanceof ApiClientError ? err.code : "UNKNOWN";
    toast.error(te.has(code) ? te(code) : t("ratingFailed"));
  }

  const fetchRating = useCallback(async () => {
    try {
      const result = await apiFetch<RatingSummary>(`/api/meals/${mealId}/rate`);
      setData(result);
    } catch {
    }
  }, [mealId]);

  useEffect(() => {
    if (!initialData) fetchRating();
  }, [fetchRating, initialData]);

  async function handleRate(rating: "like" | "dislike") {
    if (!user || isSubmitting || !isToday) return;

    const wasToggle = data?.userRating === rating;

    setData((prev) => {
      if (!prev) return prev;
      const isToggle = prev.userRating === rating;
      return {
        likes:
          prev.likes +
          (rating === "like" ? (isToggle ? -1 : 1) : 0) +
          (prev.userRating === "like" && !isToggle ? -1 : 0),
        dislikes:
          prev.dislikes +
          (rating === "dislike" ? (isToggle ? -1 : 1) : 0) +
          (prev.userRating === "dislike" && !isToggle ? -1 : 0),
        userRating: isToggle ? null : rating,
      };
    });

    setIsSubmitting(true);
    try {
      if (wasToggle) {
        await apiFetch(`/api/meals/${mealId}/rate`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/meals/${mealId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });
      }
    } catch (err) {
      showError(err);
      await fetchRating();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center gap-2 border-t border-border/40 mt-2 pt-2">
        <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-16 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  const canRate = !!user && isToday;

  const likeButton = (
    <Button
      variant={data.userRating === "like" ? "default" : "outline"}
      size="sm"
      onClick={() => handleRate("like")}
      disabled={!canRate || isSubmitting}
      aria-label={t("like")}
      className="gap-1.5"
    >
      <HugeiconsIcon icon={ThumbsUpIcon} />
      {data.likes > 0 && (
        <span className="tabular-nums">{data.likes}</span>
      )}
    </Button>
  );

  const dislikeButton = (
    <Button
      variant={data.userRating === "dislike" ? "destructive" : "outline"}
      size="sm"
      onClick={() => handleRate("dislike")}
      disabled={!canRate || isSubmitting}
      aria-label={t("dislike")}
      className="gap-1.5"
    >
      <HugeiconsIcon icon={ThumbsDownIcon} />
      {data.dislikes > 0 && (
        <span className="tabular-nums">{data.dislikes}</span>
      )}
    </Button>
  );

  const tooltipMessage = !user
    ? t("loginToRate")
    : !isToday
      ? t("onlyTodayCanRate")
      : null;

  if (tooltipMessage) {
    return (
      <div className="flex justify-center items-center gap-2 border-t border-border/40 mt-2 pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{likeButton}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{dislikeButton}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center gap-2 border-t border-border/40 mt-2 pt-2">
      {likeButton}
      {dislikeButton}
    </div>
  );
}
