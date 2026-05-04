"use client";

import { useEffect, useState, useCallback, FormEvent, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch, downloadUrl, getToken } from "@/lib/api";
import { formatDate, formatRelative, formatBytes } from "@/lib/format";
import type {
  Attachment,
  Comment,
  TicketDetail,
  TicketStatus,
  User,
} from "@/lib/types";

const NEXT_STATUSES: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "OPEN", "CLOSED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
};

export default function TicketDetailPage() {
  return (
    <AuthGuard>
      <TicketDetailContent />
    </AuthGuard>
  );
}

function TicketDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [t, c, a] = await Promise.all([
        apiFetch<TicketDetail>(`/api/tickets/${id}`),
        apiFetch<Comment[]>(`/api/tickets/${id}/comments`),
        apiFetch<Attachment[]>(`/api/tickets/${id}/attachments`),
      ]);
      setTicket(t);
      setComments(c);
      setAttachments(a);
    } catch {
      setError("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Load agent list lazily for assignment dropdown if user can assign
  useEffect(() => {
    if (!user) return;
    if (user.role === "ADMIN" || user.role === "SUPPORT_AGENT") {
      apiFetch<User[]>("/api/users/agents")
        .then(setAgents)
        .catch(() => setAgents([]));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading…
      </div>
    );
  }
  if (error || !ticket) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600 mb-4">{error || "Ticket not found"}</p>
        <Link href="/tickets" className="btn-primary">
          Back to tickets
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === ticket.owner?.id;
  const isAdmin = user?.role === "ADMIN";
  const isAgent = user?.role === "SUPPORT_AGENT";
  const canEdit = isAdmin || (isOwner && ticket.status === "OPEN");
  const canChangeStatus = isAdmin || isAgent;
  const canAssign = isAdmin || isAgent;
  const canRate =
    isOwner &&
    (ticket.status === "RESOLVED" || ticket.status === "CLOSED");
  const canClose =
    isOwner && ticket.status === "RESOLVED" && !canChangeStatus;

  async function changeStatus(newStatus: TicketStatus) {
    setActionError(null);
    try {
      await apiFetch(`/api/tickets/${id}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || "Failed to change status");
    }
  }

  async function assign(assigneeId: number) {
    setActionError(null);
    try {
      await apiFetch(`/api/tickets/${id}/assign`, {
        method: "PATCH",
        body: { assigneeId },
      });
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || "Failed to reassign");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tickets"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to tickets
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3 mt-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-mono">#{ticket.id}</span>
              <span>·</span>
              <span>Opened {formatDate(ticket.createdAt)}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {ticket.subject}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Description</h2>
            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
              {ticket.description}
            </p>
            {canEdit && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link
                  href={`/tickets/${id}/edit`}
                  className="btn-secondary text-sm"
                >
                  Edit ticket
                </Link>
              </div>
            )}
          </div>

          {/* Attachments */}
          <AttachmentsSection
            ticketId={ticket.id}
            attachments={attachments}
            onChange={loadAll}
          />

          {/* Comment thread */}
          <CommentsSection
            ticketId={ticket.id}
            comments={comments}
            canComment={ticket.status !== "CLOSED"}
            onChange={loadAll}
          />

          {/* Rating */}
          {canRate && !ticket.rating && (
            <RatingForm ticketId={ticket.id} onSubmitted={loadAll} />
          )}
          {ticket.rating !== null && (
            <RatingDisplay
              rating={ticket.rating}
              feedback={ticket.ratingFeedback}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <Detail
                label="Owner"
                value={ticket.owner?.fullName || "—"}
              />
              <Detail
                label="Assignee"
                value={
                  ticket.assignee?.fullName || (
                    <span className="text-slate-400 italic">
                      Unassigned
                    </span>
                  )
                }
              />
              <Detail
                label="Created"
                value={formatRelative(ticket.createdAt)}
              />
              <Detail
                label="Updated"
                value={formatRelative(ticket.updatedAt)}
              />
              {ticket.resolvedAt && (
                <Detail
                  label="Resolved"
                  value={formatRelative(ticket.resolvedAt)}
                />
              )}
              {ticket.closedAt && (
                <Detail
                  label="Closed"
                  value={formatRelative(ticket.closedAt)}
                />
              )}
            </dl>
          </div>

          {canChangeStatus && NEXT_STATUSES[ticket.status].length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-3">
                Change status
              </h3>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUSES[ticket.status].map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className="btn-secondary text-xs"
                  >
                    → {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {canClose && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-3">
                Close ticket
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Are you satisfied with the resolution?
              </p>
              <button
                onClick={() => changeStatus("CLOSED")}
                className="btn-primary w-full"
              >
                Mark as Closed
              </button>
            </div>
          )}

          {canAssign && agents.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-3">
                {ticket.assignee ? "Reassign to" : "Assign to"}
              </h3>
              <select
                className="input"
                value={ticket.assignee?.id || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) assign(Number(v));
                }}
              >
                <option value="">Select an agent…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------- sub-components ----------

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900 text-right">{value}</dd>
    </div>
  );
}

function CommentsSection({
  ticketId,
  comments,
  canComment,
  onChange,
}: {
  ticketId: number;
  comments: Comment[];
  canComment: boolean;
  onChange: () => void;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: { content },
      });
      setContent("");
      await onChange();
    } catch (err: any) {
      setError(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-slate-900 mb-4">
        Comments ({comments.length})
      </h2>
      {comments.length === 0 ? (
        <p className="text-sm text-slate-500 mb-4">No comments yet.</p>
      ) : (
        <ul className="space-y-4 mb-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="flex gap-3 p-3 bg-slate-50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-medium shrink-0">
                {c.author?.fullName.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900">
                    {c.author?.fullName || "Unknown"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatRelative(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {c.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form onSubmit={submit} className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="input"
            placeholder="Add a comment…"
            maxLength={5000}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="btn-primary"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500 italic">
          Comments are disabled on closed tickets.
        </p>
      )}
    </div>
  );
}

function AttachmentsSection({
  ticketId,
  attachments,
  onChange,
}: {
  ticketId: number;
  attachments: Attachment[];
  onChange: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiFetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        formData: fd,
      });
      await onChange();
      if (fileInput.current) fileInput.current.value = "";
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Authenticated download via fetch (the token isn't sent on a plain <a>).
  async function handleDownload(att: Attachment) {
    const token = getToken();
    try {
      const res = await fetch(downloadUrl(att.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download file");
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">
          Attachments ({attachments.length})
        </h2>
        <label className="btn-secondary cursor-pointer">
          {uploading ? "Uploading…" : "+ Upload file"}
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </label>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-sm text-slate-500">No attachments.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {a.originalFilename}
                </p>
                <p className="text-xs text-slate-500">
                  {formatBytes(a.sizeBytes)} ·{" "}
                  {a.uploadedBy?.fullName || "—"} ·{" "}
                  {formatRelative(a.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(a)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium ml-3"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RatingForm({
  ticketId,
  onSubmitted,
}: {
  ticketId: number;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/tickets/${ticketId}/rating`, {
        method: "POST",
        body: { rating, feedback: feedback || null },
      });
      await onSubmitted();
    } catch (err: any) {
      setError(err.message || "Failed to submit rating");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-semibold text-slate-900 mb-1">
        Rate this resolution
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        How well was your issue resolved?
      </p>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl transition-colors"
          >
            <span
              className={
                n <= (hover || rating)
                  ? "text-amber-400"
                  : "text-slate-300"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        maxLength={1000}
        className="input mb-3"
        placeholder="Optional feedback…"
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary"
      >
        {submitting ? "Submitting…" : "Submit rating"}
      </button>
    </form>
  );
}

function RatingDisplay({
  rating,
  feedback,
}: {
  rating: number;
  feedback: string | null;
}) {
  return (
    <div className="card p-6">
      <h2 className="font-semibold text-slate-900 mb-3">Resolution rating</h2>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={
              n <= rating ? "text-amber-400 text-2xl" : "text-slate-300 text-2xl"
            }
          >
            ★
          </span>
        ))}
      </div>
      {feedback && (
        <p className="text-sm text-slate-600 italic mt-2">
          &ldquo;{feedback}&rdquo;
        </p>
      )}
    </div>
  );
}
