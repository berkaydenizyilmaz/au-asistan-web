"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { logger } from "@/lib/logger";

type SupabaseClient = ReturnType<typeof createClient>;

async function fetchRole(supabase: SupabaseClient, userId: string): Promise<"user" | "admin"> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin" ? "admin" : "user";
}

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        setUser(user ?? null);
        if (user) {
          const role = await fetchRole(supabase, user.id).catch(() => "user" as const);
          setRole(role);
        } else {
          setRole(null);
        }
      })
      .catch((err) => {
        logger.error("Unexpected error in getUser", err);
        setUser(null);
        setRole(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        const role = await fetchRole(supabase, user.id).catch(() => "user" as const);
        setRole(role);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setRole]);
}
