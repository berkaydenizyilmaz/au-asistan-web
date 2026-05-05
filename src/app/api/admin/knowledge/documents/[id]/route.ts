import { successResponse, withErrorHandler, parseJsonBody } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { deleteDocument, updateDocumentWatchSettings, updateDocumentMetadata } from "@/features/knowledge/lib/mutations";
import { getDocumentById } from "@/features/knowledge/lib/queries";

export const GET = withErrorHandler(async (_request, context) => {
  await requireAdmin();
  const { id } = await context.params;
  const doc = await getDocumentById(id);
  return successResponse(doc);
});

export const PATCH = withErrorHandler(async (request, context) => {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  if (typeof body === "object" && body !== null && ("title" in body || "unit" in body)) {
    await updateDocumentMetadata(id, body);
  } else {
    await updateDocumentWatchSettings(id, body);
  }
  return successResponse(null);
});

export const DELETE = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await deleteDocument(id);
  return successResponse(null);
});
