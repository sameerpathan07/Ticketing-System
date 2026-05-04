"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { Page, TicketSummary } from "@/lib/types";

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

function emptyStats(): Stats {
  return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<TicketSummary[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Fetch recent tickets
        const recentPage = await apiFetch<Page<TicketSummary>>(
          "/api/tickets?page=0&size=5"
        );
        // Fetch counts per status. One call per status keeps server logic simple.
        const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
        const counts = await Promise.all(
          statuses.map((s) =>
            apiFetch<Page<TicketSummary>>(
              `/api/tickets?status=${s}&page=0&size=1`
            ).then((p) => p.totalElements)
          )
        );
        if (cancelled) return;
        setRecent(recentPage.content);
        setStats({
          total: counts.reduce((a, b) => a + b, 0),
          open: counts[0],
          inProgress: counts[1],
          resolved: counts[2],
          closed: counts[3],
        });
      } catch {
        // Ignore — auth guard will handle 401s
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.fullName.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">
          Here&apos;s an overview of{" "}
          {user?.role === "USER" ? "your tickets" : "all tickets"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} loading={loading} />
        <StatCard
          label="Open"
          value={stats.open}
          loading={loading}
          accent="text-blue-600"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          loading={loading}
          accent="text-amber-600"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          loading={loading}
          accent="text-emerald-600"
        />
        <StatCard
          label="Closed"
          value={stats.closed}
          loading={loading}
          accent="text-slate-500"
        />
      </div>

      {/* Recent tickets */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Recent tickets</h2>
          <Link
            href="/tickets"
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 mb-4">No tickets yet</p>
            <Link href="/tickets/new" className="btn-primary">
              Raise your first ticket
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {recent.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tickets/${t.id}`}
                  className="block hover:bg-slate-50 p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">
                        #{t.id} · {t.subject}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Opened by {t.owner?.fullName || "—"} ·{" "}
                        {formatRelative(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  accent = "text-slate-900",
}: {
  label: string;
  value: number;
  loading: boolean;
  accent?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent}`}>
        {loading ? "—" : value}
      </p>
    </div>
  );
}
