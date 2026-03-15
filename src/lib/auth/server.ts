import "server-only";

import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { getUser } from "@/lib/supabase/server";

type UserRole = "user" | "admin";

export async function getOptionalUser(): Promise<User | null> {
  return getUser();
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();

  const db = await createDrizzleSupabaseClient();
  const result = await db.admin
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const role = (result[0]?.role ?? "user") as UserRole;
  if (role !== "admin") throw new ForbiddenError();

  return user;
}
