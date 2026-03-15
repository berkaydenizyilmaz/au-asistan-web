"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { logger } from "@/lib/logger";

import { registerSchema, type RegisterFormData } from "../lib/validation";
import { signUpWithEmail } from "../lib/auth-actions";
import { OAuthButtons } from "./oauth-buttons";

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  function resolveError(error?: { message?: string }) {
    if (!error?.message) return undefined;
    return t(`errors.${error.message}` as never);
  }

  function resolveRootError(code?: string) {
    if (!code) return undefined;
    return te.has(code) ? te(code) : te("UNKNOWN");
  }

  async function onSubmit(data: RegisterFormData) {
    const { error } = await signUpWithEmail(data);
    if (error) {
      logger.error("Registration failed", error.message);
      setError("root", { message: error.code });
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <OAuthButtons />

        <FieldSeparator>{t("orContinueWithEmail")}</FieldSeparator>

        {errors.root && (
          <FieldError>{resolveRootError(errors.root.message)}</FieldError>
        )}

        <Field>
          <FieldLabel>{t("name")}</FieldLabel>
          <Input
            type="text"
            placeholder={t("namePlaceholder")}
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && (
            <FieldError>{resolveError(errors.name)}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel>{t("email")}</FieldLabel>
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <FieldError>{resolveError(errors.email)}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel>{t("password")}</FieldLabel>
          <Input
            type="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <FieldError>{resolveError(errors.password)}</FieldError>
          )}
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
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
