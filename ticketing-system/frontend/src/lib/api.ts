import type { ApiError } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const TOKEN_KEY = "ticketing_token";
const USER_KEY = "ticketing_user";

// ---------- token helpers ----------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setStoredUser(user: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ---------- core fetch wrapper ----------

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  // For multipart uploads
  formData?: FormData;
  // Skip JSON parse (e.g. for 204 / blob)
  raw?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || "GET",
    headers,
    body,
  });

  if (!res.ok) {
    let err: ApiError = { status: res.status, message: res.statusText };
    try {
      const data = await res.json();
      err = {
        status: res.status,
        message: data.message || res.statusText,
        errors: data.errors,
      };
    } catch {
      // ignore JSON parse failure
    }
    // Auto-logout on 401 from token expiry
    if (res.status === 401 && typeof window !== "undefined") {
      clearAuth();
    }
    throw err;
  }

  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function downloadUrl(attachmentId: number): string {
  return `${API_URL}/api/attachments/${attachmentId}`;
}
