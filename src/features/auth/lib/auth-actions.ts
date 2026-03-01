"use client";

import { createClient } from "@/lib/supabase/client";
import type { LoginFormData, RegisterFormData } from "../types";

export async function signInWithEmail(data: LoginFormData) {
  const supabase = createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  return { data: authData, error };
}

export async function signUpWithEmail(data: RegisterFormData) {
  const supabase = createClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.name },
    },
  });
  return { data: authData, error };
}

export async function signInWithGoogle(locale: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}`,
    },
  });
  return { data, error };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
