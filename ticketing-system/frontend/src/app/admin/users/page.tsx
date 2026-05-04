"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ApiError, Role, User } from "@/lib/types";

const ROLES: Role[] = ["USER", "SUPPORT_AGENT", "ADMIN"];

export default function AdminUsersPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <AdminUsersContent />
    </AuthGuard>
  );
}

function AdminUsersContent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const list = await apiFetch<User[]>("/api/users");
      setUsers(list);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(id: number, role: Role) {
    try {
      await apiFetch(`/api/users/${id}/role`, {
        method: "PATCH",
        body: { role },
      });
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    }
  }

  async function disable(id: number) {
    if (!confirm("Disable this user? They won't be able to log in.")) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to disable user");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Admin panel
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Users</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary"
        >
          {showCreate ? "Cancel" : "+ New user"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="mb-6">
          <CreateUserForm
            onCreated={() => {
              setShowCreate(false);
              load();
            }}
          />
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {u.fullName}
                        {isSelf && (
                          <span className="ml-2 text-xs text-slate-500">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            changeRole(u.id, e.target.value as Role)
                          }
                          disabled={isSelf}
                          className="input text-sm py-1"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.enabled ? (
                          <span className="badge bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-slate-200 text-slate-600">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isSelf && u.enabled && (
                          <button
                            onClick={() => disable(u.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Disable
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/api/users", {
        method: "POST",
        body: { fullName, email, password, role },
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("USER");
      onCreated();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Create user</h2>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Full name</label>
          <input
            type="text"
            required
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
        </div>
        <div>
          <label className="label">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="input"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
        >
          {submitting ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}
