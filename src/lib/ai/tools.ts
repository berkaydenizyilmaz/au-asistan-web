import "server-only";

import { announcementTools } from "@/features/announcements/lib/tools";
import { calendarTools } from "@/features/calendar/lib/tools";
import { eventTools } from "@/features/events/lib/tools";
import { knowledgeTools } from "@/features/knowledge/lib/tools";
import { mealTools } from "@/features/meals/lib/tools";

export const chatTools = {
  ...mealTools,
  ...calendarTools,
  ...announcementTools,
  ...eventTools,
  ...knowledgeTools,
};
