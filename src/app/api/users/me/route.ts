import { successResponse, withErrorHandler } from "@/lib/api/server";
import { deleteOwnAccount } from "@/features/auth/lib/mutations";
import { requireUser } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const GET = withErrorHandler(async () => {
  const user = await requireUser();
  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const role = (result[0]?.role ?? "user") as "user" | "admin";
  return successResponse({ role });
});

export const DELETE = withErrorHandler(async () => {
  await deleteOwnAccount();
  return successResponse({ deleted: true });
});
