import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawLocale = searchParams.get("locale") ?? DEFAULT_LOCALE;
  const locale = SUPPORTED_LOCALES.includes(rawLocale as never)
    ? rawLocale
    : DEFAULT_LOCALE;

  if (code) {
    const supabaseResponse = NextResponse.redirect(`${origin}/${locale}`);

    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return supabaseResponse;
    }

    logger.error("Auth callback: code exchange failed", error.message);
  }

  return NextResponse.redirect(
    `${origin}/${locale}/login?error=auth_callback_failed`
  );
}
