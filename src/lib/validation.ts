import { z } from "zod";

import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { ValidationError } from "./errors";

export const uuidString = z.string().uuid("Invalid ID format");

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");

export const emailSchema = z
  .string()
  .min(1, "emailRequired")
  .email("emailInvalid");

export const passwordSchema = z
  .string()
  .min(1, "passwordRequired")
  .min(PASSWORD_MIN_LENGTH, "passwordMinLength");

export function formatZodIssues(error: z.ZodError) {
  return error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

export function parseOrThrow<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  message = "Validation failed",
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(message, formatZodIssues(result.error));
  }
  return result.data;
}
