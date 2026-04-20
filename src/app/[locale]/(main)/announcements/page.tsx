import { setRequestLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { getRecentAnnouncements, getAnnouncementCategories } from "@/features/announcements/lib/queries";
import { AnnouncementList } from "@/features/announcements/components/announcement-list";
import { CategoryFilter } from "@/features/announcements/components/category-filter";

interface AnnouncementsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: AnnouncementsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("announcements") };
}

export default async function AnnouncementsPage({
  params,
  searchParams,
}: AnnouncementsPageProps) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);

  const [announcements, categories] = await Promise.all([
    getRecentAnnouncements(60, category),
    getAnnouncementCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <CategoryFilter categories={categories} selectedCategory={category} />
      </Suspense>
      <AnnouncementList announcements={announcements} />
    </div>
  );
}
