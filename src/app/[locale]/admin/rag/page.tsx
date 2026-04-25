import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { getDocuments } from "@/features/knowledge/lib/queries";
import { RagManagementClient } from "@/features/knowledge/components/rag-management-client";

interface RagPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminRagPage({ params }: RagPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.rag");
  const documents = await getDocuments();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("description")}</p>
      </div>

      <RagManagementClient initialDocuments={documents} />
    </div>
  );
}
