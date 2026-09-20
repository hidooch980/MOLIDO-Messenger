import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext.js";
import { ApiError } from "../api/client.js";

export function LoginForm() {
  const { t } = useTranslation(["auth", "errors", "common"]);
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(usernameOrEmail, password);
      } else {
        await register(username, email, password);
      }
    } catch (err) {
      setError(err instanceof ApiError ? t(`errors:${err.code}`) : t("errors:UNKNOWN_ERROR"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="brand-title">{t("common:app_name")}</h1>
      <div className="auth-tabs">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
          {t("auth:login")}
        </button>
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
          {t("auth:register")}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === "login" ? (
          <input
            placeholder={t("auth:username")}
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />
        ) : (
          <>
            <input placeholder={t("auth:username")} value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input
              type="email"
              placeholder={t("auth:email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </>
        )}
        <input
          type="password"
          placeholder={t("auth:password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? t("common:loading") : mode === "login" ? t("auth:login") : t("auth:register")}
        </button>
      </form>
    </div>
  );
}
