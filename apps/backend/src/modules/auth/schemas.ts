import { z } from "zod";
import { isLocaleCode } from "@molido/i18n";

// Usernames are ASCII-restricted for now — Unicode usernames (spec section
// 23: confusable-character protection across scripts) are a deliberate
// follow-up, tracked in RISK_REGISTER.md, not a silent omission.
export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "username must be alphanumeric/underscore only"),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  localePreference: z
    .string()
    .refine((v) => isLocaleCode(v), "unsupported locale code")
    .optional(),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
