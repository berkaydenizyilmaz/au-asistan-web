"use client";

import { type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";

import { Link } from "@/i18n/navigation";

import { useAuthForm } from "../hooks/use-auth-form";
import { loginSchema } from "../lib/validation";
import { signInWithEmail } from "../lib/auth-actions";
import { OAuthButtons } from "./oauth-buttons";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations("auth");

  const { isLoading, rootError, handleSubmit, getFieldError } = useAuthForm({
    schema: loginSchema,
    onSubmit: signInWithEmail,
    onSuccess,
  });

  function resolveError(field: string) {
    const key = getFieldError(field);
    if (!key) return undefined;
    return t(`errors.${key}` as never);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await handleSubmit({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <OAuthButtons />

        <FieldSeparator>{t("orContinueWithEmail")}</FieldSeparator>

        {rootError && <FieldError>{rootError}</FieldError>}

        <Field>
          <FieldLabel>{t("email")}</FieldLabel>
          <Input
            type="email"
            name="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
          />
          {resolveError("email") && (
            <FieldError>{resolveError("email")}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel>{t("password")}</FieldLabel>
          <Input
            type="password"
            name="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="current-password"
          />
          {resolveError("password") && (
            <FieldError>{resolveError("password")}</FieldError>
          )}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {t("login")}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("register")}
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
