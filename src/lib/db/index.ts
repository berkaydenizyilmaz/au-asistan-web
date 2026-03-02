import "server-only";

import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
const admin = drizzle({ client, schema });

type SupabaseToken = {
  iss?: string;
  sub?: string;
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  role?: string;
};

function createDrizzle(
  token: SupabaseToken,
  { admin, client }: { admin: PostgresJsDatabase<typeof schema>; client: PostgresJsDatabase<typeof schema> }
) {
  return {
    admin,
    rls: ((transaction, ...rest) => {
      return client.transaction(async (tx) => {
        try {
          await tx.execute(sql`
            select set_config('request.jwt.claims', '${sql.raw(
              JSON.stringify(token)
            )}', TRUE);
            select set_config('request.jwt.claim.sub', '${sql.raw(
              token.sub ?? ""
            )}', TRUE);
            set local role ${sql.raw(token.role ?? "anon")};
          `);
          return await transaction(tx);
        } finally {
          await tx.execute(sql`
            select set_config('request.jwt.claims', NULL, TRUE);
            select set_config('request.jwt.claim.sub', NULL, TRUE);
            reset role;
          `);
        }
      }, ...rest);
    }) as typeof client.transaction,
  };
}

function decodeJwt(token: string): SupabaseToken {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export async function createDrizzleSupabaseClient() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return createDrizzle(decodeJwt(session?.access_token ?? ""), {
    admin,
    client: drizzle({ client, schema }),
  });
}
