import { getTranslations } from "next-intl/server";
import { Megaphone01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { AnnouncementDTO } from "@/features/announcements/types";
import { DashboardSection } from "./dashboard-section";

interface DashboardAnnouncementsCardProps {
  announcements: AnnouncementDTO[];
}

export async function DashboardAnnouncementsCard({
  announcements,
}: DashboardAnnouncementsCardProps) {
  const t = await getTranslations("home");

  return (
    <DashboardSection
      titleKey="recentAnnouncements"
      href="/announcements"
      icon={Megaphone01Icon}
    >
      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noAnnouncements")}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {announcements.map((a) => (
            <div key={a.id} className="flex flex-col gap-0.5">
              <Badge variant="secondary" className="w-fit text-[10px]">
                {a.category}
              </Badge>
              <Link
                href={a.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm leading-snug hover:underline underline-offset-2"
              >
                {a.title}
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
