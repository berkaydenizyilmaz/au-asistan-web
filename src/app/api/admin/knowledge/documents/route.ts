import { successResponse, withErrorHandler } from "@/lib/api/server";
import { getDocuments } from "@/features/knowledge/lib/queries";
import { requireAdmin } from "@/lib/auth/server";

export const GET = withErrorHandler(async () => {
  await requireAdmin();
  const documents = await getDocuments();
  return successResponse(documents);
});
