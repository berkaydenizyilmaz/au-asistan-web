import "server-only";

import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { AccountDeletionError, ValidationError } from "@/lib/errors";
import { createAdminAuthClient } from "@/lib/supabase/admin";
import { parseOrThrow } from "@/lib/validation";

import { updateRoleSchema } from "./validators";

export async function updateUserRole(
  targetUserId: string,
  role: unknown
): Promise<void> {
  const adminUser = await requireAdmin();
  if (targetUserId === adminUser.id) {
    throw new ValidationError("Cannot change your own role");
  }
  const { role: validRole } = parseOrThrow(
    updateRoleSchema,
    { role },
    "Invalid role"
  );
  const db = await createDrizzleSupabaseClient();
  await db.admin
    .update(users)
    .set({ role: validRole })
    .where(eq(users.id, targetUserId));
}

export async function deleteUserAsAdmin(targetUserId: string): Promise<void> {
  const adminUser = await requireAdmin();
  if (targetUserId === adminUser.id) {
    throw new ValidationError("Cannot delete your own account from here");
  }
  const admin = createAdminAuthClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) throw new AccountDeletionError("Failed to delete user", error);
}
