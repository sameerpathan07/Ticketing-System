"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  /** Restrict to these roles. Empty = any authenticated user. */
  roles?: Role[];
}

/**
 * Client-side route guard. Redirects to /login if not authenticated, or to
 * /dashboard if authenticated but lacking the required role.
 */
export function AuthGuard({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, loading, roles, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </div>
    );
  }
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return null;
  }
  return <>{children}</>;
}
