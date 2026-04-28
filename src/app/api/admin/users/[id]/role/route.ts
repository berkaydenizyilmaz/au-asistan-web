import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";

import { updateUserRole } from "@/features/admin/lib/mutations";

export const PATCH = withErrorHandler(async (request, context) => {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  await updateUserRole(id, (body as Record<string, unknown>).role);
  return successResponse({ updated: true });
});
