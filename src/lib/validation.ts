import { z } from "zod";

export const emailSchema = z.string().min(1, "emailRequired").email("emailInvalid");

export const passwordSchema = z.string().min(1, "passwordRequired").min(6, "passwordMinLength");
