const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * Thrown for every non-2xx API response. Carries the server's stable
 * `code` (never a rendered sentence) so callers render `errors.<code>` in
 * the viewer's own locale instead of showing raw server text.
 */
export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  token?: string | null;
}

async function request<T>(method: string, path: string, options: ApiClientOptions, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(data?.code ?? "UNKNOWN_ERROR", res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, options: ApiClientOptions = {}) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options: ApiClientOptions = {}) => request<T>("POST", path, options, body),
  patch: <T>(path: string, body?: unknown, options: ApiClientOptions = {}) => request<T>("PATCH", path, options, body),
  delete: <T>(path: string, options: ApiClientOptions = {}) => request<T>("DELETE", path, options),
};

export { API_BASE };
