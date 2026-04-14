import { successResponse, withErrorHandler } from "@/lib/api/server";
import {
  getCalendarEvents,
  getActiveAcademicYear,
} from "@/features/calendar/lib/queries";

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");

  const academicYear = yearParam ?? (await getActiveAcademicYear());
  if (!academicYear) {
    return successResponse([]);
  }

  const events = await getCalendarEvents(academicYear);
  return successResponse(events);
});
