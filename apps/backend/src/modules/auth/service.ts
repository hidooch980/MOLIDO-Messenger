import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { LocalizedError, DEFAULT_LOCALE, type LocaleCode } from "@molido/i18n";
import { prisma } from "../../db/prisma.js";
import type { RegisterInput, LoginInput } from "./schemas.js";

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL = "7d";

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export interface AuthTokenPayload {
  sub: string;
  username: string;
  locale: LocaleCode;
}

function issueToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: TOKEN_TTL });
}

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const locale = (input.localePreference as LocaleCode | undefined) ?? DEFAULT_LOCALE;

  try {
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        localePreference: locale,
      },
    });

    return { user, token: issueToken({ sub: user.id, username: user.username, locale }) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      if (target.includes("username")) throw new LocalizedError("AUTH_USERNAME_TAKEN");
      if (target.includes("email")) throw new LocalizedError("AUTH_EMAIL_TAKEN");
    }
    throw err;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: input.usernameOrEmail }, { email: input.usernameOrEmail }] },
  });

  if (!user) throw new LocalizedError("AUTH_INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new LocalizedError("AUTH_INVALID_CREDENTIALS");

  const locale = (user.localePreference as LocaleCode | null) ?? DEFAULT_LOCALE;
  return { user, token: issueToken({ sub: user.id, username: user.username, locale }) };
}

export function verifyToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, jwtSecret()) as AuthTokenPayload;
  } catch {
    throw new LocalizedError("AUTH_SESSION_EXPIRED");
  }
}

/** Never leak the password hash to a client response. */
export function toPublicUser(user: { id: string; username: string; email: string; localePreference: string | null }) {
  return { id: user.id, username: user.username, email: user.email, localePreference: user.localePreference };
}
