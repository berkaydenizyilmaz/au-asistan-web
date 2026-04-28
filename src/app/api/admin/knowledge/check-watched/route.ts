import { successResponse, withErrorHandler } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { checkWatchedDocuments } from "@/features/knowledge/lib/mutations";

export const POST = withErrorHandler(async () => {
  await requireAdmin();
  const result = await checkWatchedDocuments();
  return successResponse(result);
});
