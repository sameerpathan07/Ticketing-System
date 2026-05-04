"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { apiFetch } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type {
  Page,
  Priority,
  TicketStatus,
  TicketSummary,
} from "@/lib/types";

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function TicketsPage() {
  return (
    <AuthGuard>
      <TicketsList />
    </AuthGuard>
  );
}

function TicketsList() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [sort, setSort] = useState<string>("createdAt,desc");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("size", String(SIZE));
      params.set("sort", sort);
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const data = await apiFetch<Page<TicketSummary>>(
        `/api/tickets?${params.toString()}`
      );
      setTickets(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [q, status, priority, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(searchInput);
    setPage(0);
  }

  function clearFilters() {
    setQ("");
    setSearchInput("");
    setStatus("");
    setPriority("");
    setSort("createdAt,desc");
    setPage(0);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Search, filter, and manage support tickets
          </p>
        </div>
        <Link href="/tickets/new" className="btn-primary">
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <form
          onSubmit={applySearch}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by subject or description…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TicketStatus | "");
              setPage(0);
            }}
            className="input md:w-44"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as Priority | "");
              setPage(0);
            }}
            className="input md:w-40"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            className="input md:w-48"
          >
            <option value="createdAt,desc">Newest first</option>
            <option value="createdAt,asc">Oldest first</option>
            <option value="priority,desc">Priority (high → low)</option>
            <option value="priority,asc">Priority (low → high)</option>
            <option value="updatedAt,desc">Recently updated</option>
          </select>
          <button type="submit" className="btn-primary md:w-auto">
            Search
          </button>
          {(q || status || priority) && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary md:w-auto"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Results */}
      <div className="card overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">
              No tickets match your filters
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold text-slate-600 uppercase">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/tickets/${t.id}`)
                      }
                    >
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">
                        #{t.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {t.owner?.fullName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {t.assignee?.fullName || (
                          <span className="text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatRelative(t.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <span className="text-sm text-slate-500">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
