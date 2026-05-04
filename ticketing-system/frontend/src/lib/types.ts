// Mirror of backend DTOs. Keep these in sync with the Java DTO classes.

export type Role = "USER" | "SUPPORT_AGENT" | "ADMIN";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface TicketSummary {
  id: number;
  subject: string;
  status: TicketStatus;
  priority: Priority;
  owner: User | null;
  assignee: User | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail {
  id: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  owner: User | null;
  assignee: User | null;
  rating: number | null;
  ratingFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface Comment {
  id: number;
  content: string;
  author: User | null;
  createdAt: string;
}

export interface Attachment {
  id: number;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: User | null;
  uploadedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}
