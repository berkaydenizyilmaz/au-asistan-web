import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

export const emailSchema = z
  .string()
  .min(1, "emailRequired")
  .email("emailInvalid");

export const passwordSchema = z
  .string()
  .min(1, "passwordRequired")
  .min(PASSWORD_MIN_LENGTH, "passwordMinLength");
