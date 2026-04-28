import { successResponse, withErrorHandler } from "@/lib/api/server";

import { deleteUserAsAdmin } from "@/features/admin/lib/mutations";

export const DELETE = withErrorHandler(async (_request, context) => {
  const { id } = await context.params;
  await deleteUserAsAdmin(id);
  return successResponse({ deleted: true });
});
