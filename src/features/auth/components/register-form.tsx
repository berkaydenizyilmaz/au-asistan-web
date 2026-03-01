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
import { registerSchema } from "../lib/validation";
import { signUpWithEmail } from "../lib/auth-actions";
import { OAuthButtons } from "./oauth-buttons";

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations("auth");

  const { isLoading, rootError, handleSubmit, getFieldError } = useAuthForm({
    schema: registerSchema,
    onSubmit: signUpWithEmail,
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
      name: formData.get("name"),
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
          <FieldLabel>{t("name")}</FieldLabel>
          <Input
            type="text"
            name="name"
            placeholder={t("namePlaceholder")}
            autoComplete="name"
          />
          {resolveError("name") && (
            <FieldError>{resolveError("name")}</FieldError>
          )}
        </Field>

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
            autoComplete="new-password"
          />
          {resolveError("password") && (
            <FieldError>{resolveError("password")}</FieldError>
          )}
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {t("register")}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {t("haveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("login")}
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
