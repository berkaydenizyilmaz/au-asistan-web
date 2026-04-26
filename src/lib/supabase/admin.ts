import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  return key;
}

export function createAdminAuthClient() {
  return createClient(env.supabaseUrl, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
