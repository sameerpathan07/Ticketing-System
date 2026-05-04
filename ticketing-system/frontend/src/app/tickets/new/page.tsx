"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { apiFetch } from "@/lib/api";
import type { ApiError, Priority, TicketDetail } from "@/lib/types";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function NewTicketPage() {
  return (
    <AuthGuard>
      <NewTicketForm />
    </AuthGuard>
  );
}

function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await apiFetch<TicketDetail>("/api/tickets", {
        method: "POST",
        body: { subject, description, priority },
      });
      router.push(`/tickets/${created.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to create ticket");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/tickets"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to tickets
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          Raise a new ticket
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Describe your issue and our support team will get back to you.
        </p>
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
            placeholder="Brief summary of the issue"
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
            placeholder="Provide as much detail as possible…"
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
          <Link href="/tickets" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? "Creating…" : "Create ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
