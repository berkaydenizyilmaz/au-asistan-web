import "server-only";

import { requireUserId } from "@/lib/auth/server";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { AccountDeletionError } from "@/lib/errors";

export async function deleteOwnAccount(): Promise<void> {
  const userId = await requireUserId();
  const admin = createAdminAuthClient();

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new AccountDeletionError("Failed to delete user account", error);
  }
}
