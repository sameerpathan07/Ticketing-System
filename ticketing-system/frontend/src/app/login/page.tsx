"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiError } from "@/lib/types";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white text-lg font-bold mb-3">
            LS
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sign in to Ticketing
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your support tickets
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-sm text-center text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Register
            </Link>
          </p>
        </form>

        <div className="mt-6 card p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-2">Demo accounts:</p>
          <ul className="space-y-1 font-mono">
            <li>admin@demo.com / Admin@123</li>
            <li>agent@demo.com / Agent@123</li>
            <li>user@demo.com / User@123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
