"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThumbsUpIcon, ThumbsDownIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/auth-store";

interface MealRatingProps {
  mealId: string;
  isToday: boolean;
}

interface RatingData {
  likes: number;
  dislikes: number;
  userRating: "like" | "dislike" | null;
}

export function MealRating({ mealId, isToday }: MealRatingProps) {
  const t = useTranslations("meals");
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<RatingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRating = useCallback(async () => {
    try {
      const res = await fetch(`/api/meals/${mealId}/rate`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch {
      // Rating is non-critical
    }
  }, [mealId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

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
        await fetch(`/api/meals/${mealId}/rate`, { method: "DELETE" });
      } else {
        await fetch(`/api/meals/${mealId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });
      }
    } catch {
      await fetchRating();
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading
  if (!data) {
    return (
      <div className="flex items-center gap-2 pt-3 border-t border-border/50 mt-3">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const hasAnyRatings = data.likes > 0 || data.dislikes > 0;

  // Past days: read-only counts
  if (!isToday) {
    if (!hasAnyRatings) return null;

    return (
      <div className="flex items-center gap-3 pt-3 border-t border-border/50 mt-3 text-muted-foreground">
        {data.likes > 0 && (
          <span className="flex items-center gap-1.5 text-sm">
            <HugeiconsIcon icon={ThumbsUpIcon} className="size-4" />
            {data.likes}
          </span>
        )}
        {data.dislikes > 0 && (
          <span className="flex items-center gap-1.5 text-sm">
            <HugeiconsIcon icon={ThumbsDownIcon} className="size-4" />
            {data.dislikes}
          </span>
        )}
      </div>
    );
  }

  // Today: interactive
  const canRate = !!user;

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

  // Not logged in: wrap each button in tooltip
  if (!canRate) {
    return (
      <div className="flex items-center gap-2 pt-3 border-t border-border/50 mt-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{likeButton}</TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t("loginToRate")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{dislikeButton}</TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t("loginToRate")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border/50 mt-3">
      {likeButton}
      {dislikeButton}
    </div>
  );
}
