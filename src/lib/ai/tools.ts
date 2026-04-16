import "server-only";

import { calendarTools } from "@/features/calendar/lib/tools";
import { mealTools } from "@/features/meals/lib/tools";

export const chatTools = {
  ...mealTools,
  ...calendarTools,
};
