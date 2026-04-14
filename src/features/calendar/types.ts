export type Semester = "fall" | "spring" | "general";

export interface ParsedCalendarEvent {
  title: string;
  startDate: string;
  endDate?: string;
  semester: Semester;
  academicYear: string;
  sortOrder: number;
}

export interface CalendarEventDTO {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  semester: Semester;
  academicYear: string;
}
