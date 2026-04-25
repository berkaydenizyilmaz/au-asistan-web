import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { requireAdmin } from "@/lib/auth/server";
import { Link } from "@/i18n/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAdmin();
  const t = await getTranslations("admin");

  const email = user.email ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("welcomeTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/rag">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon icon={Database01Icon} className="size-5 text-primary" />
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="mt-3">{t("rag.title")}</CardTitle>
              <CardDescription>{t("rag.description")}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
