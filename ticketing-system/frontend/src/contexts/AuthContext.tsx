"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthResponse, User } from "@/lib/types";
import {
  apiFetch,
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount, then verify with backend.
  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser<User>();
    if (token && stored) {
      setUser(stored);
      // Validate the token by hitting /me. If invalid, clear silently.
      apiFetch<User>("/api/auth/me")
        .then((u) => {
          setUser(u);
          setStoredUser(u);
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(res.token);
      const u: User = {
        id: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: res.role,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      setStoredUser(u);
      setUser(u);
      router.push("/dashboard");
    },
    [router]
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const res = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: { fullName, email, password },
      });
      setToken(res.token);
      const u: User = {
        id: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: res.role,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      setStoredUser(u);
      setUser(u);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/login");
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      const u = await apiFetch<User>("/api/auth/me");
      setUser(u);
      setStoredUser(u);
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
