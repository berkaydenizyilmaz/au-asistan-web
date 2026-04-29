import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { env } from "./lib/env";

const handleI18nRouting = createIntlMiddleware(routing);

// /[locale]/admin veya /[locale]/admin/* eşleştirir
const ADMIN_ROUTE_RE = /^\/[^/]+\/admin(\/|$)/;

export async function proxy(request: NextRequest) {
  // Step 1: Supabase session yenileme — getUser() çağrısından önce
  // başka bir şey yapılmamalı (Supabase docs uyarısı)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Step 2: Admin rotaları — giriş yapmamış kullanıcıyı login'e yönlendir
  if (ADMIN_ROUTE_RE.test(request.nextUrl.pathname) && !user) {
    const locale = request.nextUrl.pathname.split("/")[1];
    const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies
      .getAll()
      .forEach((c) => redirectResponse.cookies.set(c.name, c.value, c));
    return redirectResponse;
  }

  // Step 3: next-intl locale routing
  const i18nResponse = handleI18nRouting(request);

  // Step 4: Session cookie'lerini i18n response'a kopyala — kritik,
  // aksi hâlde tarayıcı ve sunucu senkronizasyonu bozulur
  supabaseResponse.cookies
    .getAll()
    .forEach((c) => i18nResponse.cookies.set(c.name, c.value, c));

  return i18nResponse;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
