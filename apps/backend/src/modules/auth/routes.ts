import { Router } from "express";
import { LocalizedError } from "@molido/i18n";
import { registerSchema, loginSchema } from "./schemas.js";
import { registerUser, loginUser, toPublicUser } from "./service.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new LocalizedError("VALIDATION_FAILED", { details: parsed.error.issues.map((i) => i.path.join(".")).join(",") }));
    return;
  }

  try {
    const { user, token } = await registerUser(parsed.data);
    res.status(201).json({ user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new LocalizedError("VALIDATION_FAILED"));
    return;
  }

  try {
    const { user, token } = await loginUser(parsed.data);
    res.json({ user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
});
