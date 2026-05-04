"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { apiFetch } from "@/lib/api";
import type { ApiError, Priority, TicketDetail } from "@/lib/types";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function EditTicketPage() {
  return (
    <AuthGuard>
      <EditForm />
    </AuthGuard>
  );
}

function EditForm() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TicketDetail>(`/api/tickets/${id}`)
      .then((t) => {
        setTicket(t);
        setSubject(t.subject);
        setDescription(t.description);
        setPriority(t.priority);
      })
      .catch(() => setError("Failed to load ticket"))
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/api/tickets/${id}`, {
        method: "PATCH",
        body: { subject, description, priority },
      });
      router.push(`/tickets/${id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to save");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href={`/tickets/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to ticket
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          Edit ticket #{id}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="label">Subject</label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={200}
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            required
            minLength={5}
            maxLength={5000}
            rows={8}
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="input"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/tickets/${id}`} className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
