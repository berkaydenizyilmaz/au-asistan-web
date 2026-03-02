"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThumbsUpIcon, ThumbsDownIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

interface MealRatingProps {
  mealId: string;
}

interface RatingData {
  likes: number;
  dislikes: number;
  userRating: "like" | "dislike" | null;
}

export function MealRating({ mealId }: MealRatingProps) {
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
      // Silently fail — rating is non-critical
    }
  }, [mealId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  async function handleRate(rating: "like" | "dislike") {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);

    // Optimistic update
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

    // Capture current state before optimistic update overwrites it
    const wasToggle = data?.userRating === rating;

    try {
      if (wasToggle) {
        // Toggle off — delete rating
        await fetch(`/api/meals/${mealId}/rate`, { method: "DELETE" });
      } else {
        // Set or change rating
        await fetch(`/api/meals/${mealId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });
      }
    } catch {
      // Revert on error
      await fetchRating();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!data) return null;

  return (
    <div className="flex items-center gap-1 pt-1">
      <Button
        variant={data.userRating === "like" ? "default" : "ghost"}
        size="icon-xs"
        onClick={() => handleRate("like")}
        disabled={!user || isSubmitting}
        aria-label={t("like")}
      >
        <HugeiconsIcon icon={ThumbsUpIcon} />
      </Button>
      {data.likes > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {data.likes}
        </span>
      )}
      <Button
        variant={data.userRating === "dislike" ? "destructive" : "ghost"}
        size="icon-xs"
        onClick={() => handleRate("dislike")}
        disabled={!user || isSubmitting}
        aria-label={t("dislike")}
      >
        <HugeiconsIcon icon={ThumbsDownIcon} />
      </Button>
      {data.dislikes > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {data.dislikes}
        </span>
      )}
    </div>
  );
}
