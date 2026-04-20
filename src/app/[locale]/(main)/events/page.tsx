import { setRequestLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { getUpcomingEvents, getEventCategories } from "@/features/events/lib/queries";
import { EventList } from "@/features/events/components/event-list";
import { EventCategoryFilter } from "@/features/events/components/event-category-filter";

interface EventsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: EventsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("events") };
}

export default async function EventsPage({
  params,
  searchParams,
}: EventsPageProps) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);

  const [events, categories] = await Promise.all([
    getUpcomingEvents(50, category),
    getEventCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <EventCategoryFilter categories={categories} selectedCategory={category} />
      </Suspense>
      <EventList events={events} />
    </div>
  );
}
