"use client";

import { createClient } from "@/lib/supabase/client";
import type { LoginFormData, RegisterFormData } from "../types";

interface AuthActionError {
  code: string;
  message: string;
}

const SUPABASE_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "INVALID_CREDENTIALS",
  "User already registered": "EMAIL_ALREADY_REGISTERED",
  "Email not confirmed": "EMAIL_NOT_CONFIRMED",
  "New password should be different from the old password.": "SAME_PASSWORD",
  "Password should be at least 6 characters.": "PASSWORD_TOO_SHORT",
  "Email rate limit exceeded": "RATE_LIMIT",
  "For security purposes, you can only request this after": "RATE_LIMIT",
};

function mapSupabaseError(message: string): string {
  const direct = SUPABASE_ERROR_MAP[message];
  if (direct) return direct;

  for (const [key, code] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (message.startsWith(key)) return code;
  }

  return "UNKNOWN";
}

function toAuthError(error: { message: string }): AuthActionError {
  return { code: mapSupabaseError(error.message), message: error.message };
}

export async function signInWithEmail(
  data: LoginFormData,
): Promise<{ error: AuthActionError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  return { error: error ? toAuthError(error) : null };
}

export async function signUpWithEmail(
  data: RegisterFormData,
): Promise<{ error: AuthActionError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.name },
    },
  });
  return { error: error ? toAuthError(error) : null };
}

export async function signInWithGoogle(locale: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
    },
  });
  return { data, error: error ? toAuthError(error) : null };
}

export async function signOut(): Promise<{ error: AuthActionError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error: error ? toAuthError(error) : null };
}
