import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

import { academicCalendar } from "@/lib/db/schema/content";

export const insertCalendarEventSchema = createInsertSchema(academicCalendar, {
  startDate: (schema) =>
    schema.regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
  endDate: (schema) =>
    schema.regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
  semester: () => z.enum(["fall", "spring", "general"]),
  academicYear: (schema) =>
    schema.regex(/^\d{4}-\d{4}$/, "Invalid academic year (YYYY-YYYY)"),
}).omit({ id: true, createdAt: true });

export const academicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, "Invalid academic year format (YYYY-YYYY)");
