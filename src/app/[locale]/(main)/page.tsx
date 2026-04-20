import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { getMealByDate } from "@/features/meals/lib/queries";
import { getUpcomingEvents as getCalendarEvents } from "@/features/calendar/lib/queries";
import { getRecentAnnouncements } from "@/features/announcements/lib/queries";
import { getUpcomingEvents } from "@/features/events/lib/queries";
import { getTodayStr } from "@/lib/date";
import { DashboardChatCta } from "@/features/dashboard/components/dashboard-chat-cta";
import { DashboardMealCard } from "@/features/dashboard/components/dashboard-meal-card";
import { DashboardCalendarCard } from "@/features/dashboard/components/dashboard-calendar-card";
import { DashboardAnnouncementsCard } from "@/features/dashboard/components/dashboard-announcements-card";
import { DashboardEventsCard } from "@/features/dashboard/components/dashboard-events-card";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [todayMeal, calendarEvents, announcements, events] = await Promise.all([
    getMealByDate(getTodayStr()),
    getCalendarEvents(4),
    getRecentAnnouncements(3),
    getUpcomingEvents(4),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <Suspense>
        <DashboardChatCta />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardMealCard meal={todayMeal} />
        <DashboardCalendarCard events={calendarEvents} />
        <DashboardAnnouncementsCard announcements={announcements} />
        <DashboardEventsCard events={events} />
      </div>
    </div>
  );
}
