import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/client.js";
import type { AuthResponse, AuthUser } from "../api/types.js";
import { changeLocale } from "../i18n/index.js";

const STORAGE_KEY = "molido.auth";

interface StoredAuth {
  token: string;
  user: AuthUser;
}

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(auth: StoredAuth | null) {
  try {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Local persistence is a convenience only; losing it just means a
    // fresh login next time, not a functional failure.
  }
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateLocalUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());

  const applyAuth = useCallback(async (response: AuthResponse) => {
    setAuth(response);
    writeStoredAuth(response);
    if (response.user.localePreference) {
      await changeLocale(response.user.localePreference as never);
    }
  }, []);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const response = await api.post<AuthResponse>("/api/auth/login", { usernameOrEmail, password });
      await applyAuth(response);
    },
    [applyAuth]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const response = await api.post<AuthResponse>("/api/auth/register", { username, email, password });
      await applyAuth(response);
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    setAuth(null);
    writeStoredAuth(null);
  }, []);

  const updateLocalUser = useCallback((patch: Partial<AuthUser>) => {
    setAuth((current) => {
      if (!current) return current;
      const next = { ...current, user: { ...current.user, ...patch } };
      writeStoredAuth(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token: auth?.token ?? null, user: auth?.user ?? null, login, register, logout, updateLocalUser }),
    [auth, login, register, logout, updateLocalUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
