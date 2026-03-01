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

import { loginSchema, type LoginFormData } from "../lib/validation";
import { signInWithEmail } from "../lib/auth-actions";
import { OAuthButtons } from "./oauth-buttons";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations("auth");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  function resolveError(error?: { message?: string }) {
    if (!error?.message) return undefined;
    return t(`errors.${error.message}` as never);
  }

  async function onSubmit(data: LoginFormData) {
    const { error } = await signInWithEmail(data);
    if (error) {
      logger.error("Login failed", error.message);
      setError("root", { message: error.message });
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <OAuthButtons />

        <FieldSeparator>{t("orContinueWithEmail")}</FieldSeparator>

        {errors.root && <FieldError>{errors.root.message}</FieldError>}

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
            autoComplete="current-password"
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
