import { successResponse, withErrorHandler } from "@/lib/api/server";
import { reingestDocument } from "@/features/knowledge/lib/mutations";

export const POST = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await reingestDocument(id);
  return successResponse(null);
});
