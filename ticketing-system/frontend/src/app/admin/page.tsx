"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";

export default function AdminPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <AdminContent />
    </AuthGuard>
  );
}

function AdminContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Admin panel</h1>
      <p className="text-slate-500 mb-8">
        Manage users, monitor tickets, and override system state.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="card p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-slate-900 text-lg mb-1">
            User management
          </h2>
          <p className="text-sm text-slate-500">
            Create users, assign roles, deactivate accounts
          </p>
        </Link>
        <Link
          href="/tickets"
          className="card p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-slate-900 text-lg mb-1">
            All tickets
          </h2>
          <p className="text-sm text-slate-500">
            View, filter, and override any ticket in the system
          </p>
        </Link>
      </div>
    </div>
  );
}
