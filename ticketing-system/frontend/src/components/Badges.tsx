import type { Priority, TicketStatus } from "@/lib/types";

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-200 text-slate-700",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-sky-100 text-sky-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority]}`}>{priority}</span>
  );
}
