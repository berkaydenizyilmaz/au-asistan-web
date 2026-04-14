"use client";

import { useEffect } from "react";

export function CalendarAutoScroll() {
  useEffect(() => {
    // Double rAF ensures layout is fully computed after hydration
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById("calendar-anchor");
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const scrollTop = window.scrollY + rect.top - 100;
        window.scrollTo({ top: Math.max(0, scrollTop), behavior: "instant" });
      });
    });
  }, []);

  return null;
}
