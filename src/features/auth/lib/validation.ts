import type { LoginFormData, RegisterFormData, AuthError } from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginForm(data: LoginFormData): AuthError[] | null {
  const errors: AuthError[] = [];

  if (!data.email.trim()) {
    errors.push({ message: "auth.errors.emailRequired", field: "email" });
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push({ message: "auth.errors.emailInvalid", field: "email" });
  }

  if (!data.password) {
    errors.push({ message: "auth.errors.passwordRequired", field: "password" });
  } else if (data.password.length < 6) {
    errors.push({
      message: "auth.errors.passwordMinLength",
      field: "password",
    });
  }

  return errors.length > 0 ? errors : null;
}

export function validateRegisterForm(
  data: RegisterFormData
): AuthError[] | null {
  const errors: AuthError[] = [];

  if (!data.name.trim()) {
    errors.push({ message: "auth.errors.nameRequired", field: "name" });
  } else if (data.name.trim().length < 2) {
    errors.push({ message: "auth.errors.nameMinLength", field: "name" });
  }

  const loginErrors = validateLoginForm(data);
  if (loginErrors) {
    errors.push(...loginErrors);
  }

  return errors.length > 0 ? errors : null;
}
