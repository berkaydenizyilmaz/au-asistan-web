import { successResponse, withErrorHandler } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { deleteDocument } from "@/features/knowledge/lib/mutations";
import { getDocumentById } from "@/features/knowledge/lib/queries";

export const GET = withErrorHandler(async (_request, context) => {
  await requireAdmin();
  const { id } = await context.params;
  const doc = await getDocumentById(id);
  return successResponse(doc);
});

export const DELETE = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await deleteDocument(id);
  return successResponse(null);
});
