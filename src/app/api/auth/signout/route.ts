import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const rawLocale = request.nextUrl.searchParams.get("locale") ?? DEFAULT_LOCALE;
  const locale = SUPPORTED_LOCALES.includes(rawLocale as never) ? rawLocale : DEFAULT_LOCALE;

  const response = NextResponse.redirect(new URL(`/${locale}/login`, request.nextUrl.origin));

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.signOut();

  return response;
}
