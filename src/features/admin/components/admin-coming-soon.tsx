import { getTranslations } from "next-intl/server";

type AdminNavKey = "analytics" | "feedback" | "users" | "cron" | "logs";

interface AdminComingSoonProps {
  titleKey: AdminNavKey;
}

export async function AdminComingSoon({ titleKey }: AdminComingSoonProps) {
  const t = await getTranslations("admin.nav");
  const tc = await getTranslations("common");

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
      <p className="text-muted-foreground">{tc("comingSoon")}</p>
    </div>
  );
}
