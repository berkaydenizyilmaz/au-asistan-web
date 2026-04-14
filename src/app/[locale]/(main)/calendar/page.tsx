import { setRequestLocale, getTranslations } from "next-intl/server";

import { getTodayStr } from "@/lib/date";
import {
  getCalendarEvents,
  getActiveAcademicYear,
} from "@/features/calendar/lib/queries";
import { SemesterTabs } from "@/features/calendar/components/semester-tabs";
import { CalendarTimeline } from "@/features/calendar/components/calendar-timeline";
import type { CalendarEventDTO } from "@/features/calendar/types";
import type { Semester } from "@/features/calendar/types";

interface CalendarPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ semester?: string }>;
}

function detectActiveSemester(
  events: CalendarEventDTO[],
  today: string,
): Semester {
  const hasUpcoming = (sem: Semester) =>
    events.some(
      (e) => e.semester === sem && today <= (e.endDate ?? e.startDate),
    );

  if (hasUpcoming("spring")) return "spring";
  if (hasUpcoming("fall")) return "fall";
  // Both past — show spring (ends later in the academic year)
  return "spring";
}

export async function generateMetadata({ params }: CalendarPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendar" });
  return { title: t("title") };
}

export default async function CalendarPage({
  params,
  searchParams,
}: CalendarPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calendar" });

  const academicYear = await getActiveAcademicYear();

  if (!academicYear) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-lg">
          {t("noActiveCalendar")}
        </p>
        <p className="text-muted-foreground/60 text-sm mt-2">
          {t("noActiveCalendarDescription")}
        </p>
      </div>
    );
  }

  const allEvents = await getCalendarEvents(academicYear);
  const today = getTodayStr();

  const { semester: semesterParam } = await searchParams;
  const semester: Semester =
    semesterParam === "fall" || semesterParam === "spring"
      ? semesterParam
      : detectActiveSemester(allEvents, today);

  const filteredEvents = allEvents.filter((e) => e.semester === semester);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("academicYear", { year: academicYear })}
        </p>
      </div>

      <SemesterTabs activeSemester={semester} />
      <CalendarTimeline key={semester} events={filteredEvents} />
    </div>
  );
}
