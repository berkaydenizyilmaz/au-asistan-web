"use client";

import { useRouter } from "@/i18n/navigation";
import { LoginForm } from "@/features/auth/components/login-form";

export function LoginPageClient() {
  const router = useRouter();

  return <LoginForm onSuccess={() => router.push("/")} />;
}
