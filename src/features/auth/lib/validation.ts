import { z } from "zod";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { NAME_MIN_LENGTH } from "@/lib/constants";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "nameRequired")
    .min(NAME_MIN_LENGTH, "nameMinLength"),
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
