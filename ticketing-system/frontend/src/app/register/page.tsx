"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiError } from "@/lib/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(fullName, email, password);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Registration failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Sign up to start raising support tickets
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label">Full name</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-sm text-center text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
