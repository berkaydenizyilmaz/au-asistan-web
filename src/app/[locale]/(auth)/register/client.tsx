"use client";

import { useRouter } from "@/i18n/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";

export function RegisterPageClient() {
  const router = useRouter();

  return <RegisterForm onSuccess={() => router.push("/")} />;
}
