import { getTranslations } from "next-intl/server";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import type { EventDTO } from "@/features/events/types";
import { DashboardSection } from "./dashboard-section";

interface DashboardEventsCardProps {
  events: EventDTO[];
}

function formatEventDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1] ?? ""}`;
}

export async function DashboardEventsCard({ events }: DashboardEventsCardProps) {
  const t = await getTranslations("home");

  return (
    <DashboardSection titleKey="upcomingEvents" href="/events" icon={Calendar01Icon}>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noEvents")}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-[10px] font-medium tabular-nums text-primary/80 min-w-10">
                {formatEventDate(e.eventDate)}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {e.category}
                </Badge>
                <span className="text-sm leading-snug">{e.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
