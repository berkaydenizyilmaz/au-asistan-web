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
import { validateRegisterForm } from "../lib/validation";
import { signUpWithEmail } from "../lib/auth-actions";
import { OAuthButtons } from "./oauth-buttons";
import type { RegisterFormData } from "../types";

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations("auth");

  const { isLoading, errors, handleSubmit } = useAuthForm<RegisterFormData>({
    validate: validateRegisterForm,
    onSubmit: signUpWithEmail,
    onSuccess,
  });

  function getFieldError(field: string) {
    const error = errors.find((e) => e.field === field);
    if (!error) return undefined;
    return error.message.startsWith("auth.errors.")
      ? t(error.message.replace("auth.", "") as never)
      : error.message;
  }

  function getRootError() {
    const error = errors.find((e) => e.field === "root");
    if (!error) return undefined;
    return error.message;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await handleSubmit({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <OAuthButtons />

        <FieldSeparator>{t("orContinueWithEmail")}</FieldSeparator>

        {getRootError() && (
          <FieldError>{getRootError()}</FieldError>
        )}

        <Field>
          <FieldLabel>{t("name")}</FieldLabel>
          <Input
            type="text"
            name="name"
            placeholder={t("namePlaceholder")}
            autoComplete="name"
            required
          />
          {getFieldError("name") && (
            <FieldError>{getFieldError("name")}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel>{t("email")}</FieldLabel>
          <Input
            type="email"
            name="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            required
          />
          {getFieldError("email") && (
            <FieldError>{getFieldError("email")}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel>{t("password")}</FieldLabel>
          <Input
            type="password"
            name="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            required
          />
          {getFieldError("password") && (
            <FieldError>{getFieldError("password")}</FieldError>
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
