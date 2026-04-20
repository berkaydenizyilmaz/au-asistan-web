import { getTranslations } from "next-intl/server";

import type { EventDTO } from "../types";
import { EventCard } from "./event-card";

interface EventListProps {
  events: EventDTO[];
}

export async function EventList({ events }: EventListProps) {
  const t = await getTranslations("events");

  if (events.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t("noEvents")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}
