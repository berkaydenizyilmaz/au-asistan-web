import { successResponse, withErrorHandler } from "@/lib/api/server";
import { deleteOwnAccount } from "@/features/auth/lib/mutations";

export const DELETE = withErrorHandler(async () => {
  await deleteOwnAccount();
  return successResponse({ deleted: true });
});
