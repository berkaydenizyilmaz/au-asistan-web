"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { Semester } from "../types";

interface SemesterTabsProps {
  activeSemester: Semester;
}

export function SemesterTabs({ activeSemester }: SemesterTabsProps) {
  const t = useTranslations("calendar");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("semester", value);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  return (
    <Tabs value={activeSemester} onValueChange={handleChange}>
      <TabsList className={cn(isPending && "opacity-50 pointer-events-none")}>
        <TabsTrigger value="fall">{t("fall")}</TabsTrigger>
        <TabsTrigger value="spring">{t("spring")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
