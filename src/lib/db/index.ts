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
      }, ...rest);
    }) as typeof client.transaction,
  };
}

export async function createDrizzleSupabaseClient() {
  const { getUser } = await import("@/lib/supabase/server");
  const user = await getUser();

  const token: SupabaseToken = user
    ? { sub: user.id, role: "authenticated" }
    : {};

  return createDrizzle(token, {
    admin,
    client: drizzle({ client, schema }),
  });
}
