# 🎓 Ticketing System

A full-stack support ticketing system built for the LeapScholar take-home assignment.

**Stack:** Spring Boot (Java 17) · PostgreSQL (or H2 for local dev) · Next.js 14 (App Router) · Tailwind CSS · JWT auth

---

## ✅ What's implemented

### Must-have features
- **Authentication & Authorization** — JWT-based login/logout with BCrypt-hashed passwords; three roles (`USER`, `SUPPORT_AGENT`, `ADMIN`); strict role-based and ownership-based access control on every endpoint.
- **User Dashboard** — raise new tickets, list & filter own tickets, see status, comment thread with timestamps and authors.
- **Ticket Management** — full lifecycle (`OPEN → IN_PROGRESS → RESOLVED → CLOSED`) with validated state transitions, assignment/reassignment, owner & assignee tracking.
- **Admin Panel** — create/disable users, change roles, view & override any ticket, monitor statuses across the system.
- **Access Control** — admins can manage users and override anything; agents can be assigned and change status; regular users only see and edit their own tickets.

### Good-to-have features (also implemented)
- **Email Notifications** — async emails on ticket creation, assignment, and status change. Toggleable via `app.mail.enabled`. Off by default.
- **Search & Filter** — search by subject/description, filter by status/priority/assignee, multi-field sorting, paginated.
- **Ticket Prioritization** — `LOW` / `MEDIUM` / `HIGH` / `URGENT`, sortable.
- **File Attachments** — secure upload/download. Files stored on disk with UUID-prefixed names; path-traversal defended; 10 MB cap.
- **Resolution Rating** — 1–5 stars with optional feedback; only the owner can rate, only after `RESOLVED` or `CLOSED`.

---

## 📂 Project structure

```
ticketing-system/
├── backend/              # Spring Boot API
│   ├── pom.xml
│   └── src/main/java/com/leapscholar/ticketing/
│       ├── config/       # SecurityConfig, DataSeeder
│       ├── controller/   # REST endpoints
│       ├── dto/          # Request/response records
│       ├── entity/       # JPA entities
│       ├── enums/        # Role, TicketStatus, Priority
│       ├── exception/    # Custom exceptions + global handler
│       ├── repository/   # Spring Data repos
│       ├── security/     # JWT filter, services
│       └── service/      # Business logic
└── frontend/             # Next.js app
    ├── package.json
    └── src/
        ├── app/          # Routes (login, dashboard, tickets, admin…)
        ├── components/   # Navbar, AuthGuard, Badges
        ├── contexts/     # AuthContext
        └── lib/          # API client, types, formatters
```

---

## 🚀 Quick start (3 minutes, no Postgres needed)

The backend runs against an in-memory H2 database by default, so you can demo
the full system with zero database setup.

### 1. Backend

```bash
cd backend
./mvnw spring-boot:run        # or: mvn spring-boot:run
```

Backend starts on **http://localhost:8080**.

On first boot, the seeder creates three demo accounts and two sample tickets:

| Role          | Email             | Password   |
| ------------- | ----------------- | ---------- |
| Admin         | admin@demo.com    | Admin@123  |
| Support Agent | agent@demo.com    | Agent@123  |
| User          | user@demo.com     | User@123   |

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:3000**. Open it and log in with any of the demo accounts above.

---

## 🐘 Running with PostgreSQL

```bash
# 1. Create the database
createdb ticketing

# 2. Run with the postgres profile
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=postgres \
  -Dspring-boot.run.arguments="--DB_URL=jdbc:postgresql://localhost:5432/ticketing --DB_USERNAME=postgres --DB_PASSWORD=postgres"
```

Or via env vars:

```bash
export SPRING_PROFILES_ACTIVE=postgres
export DB_URL=jdbc:postgresql://localhost:5432/ticketing
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
mvn spring-boot:run
```

---

## 📡 API reference

All endpoints (except `/api/auth/**`) require an `Authorization: Bearer <token>` header.

### Auth
| Method | Path                  | Description |
| ------ | --------------------- | ----------- |
| POST   | `/api/auth/register`  | Self-register (always creates a `USER`) |
| POST   | `/api/auth/login`     | Returns JWT |
| POST   | `/api/auth/logout`    | No-op (client drops token) |
| GET    | `/api/auth/me`        | Current user info |

### Tickets
| Method | Path                                | Description |
| ------ | ----------------------------------- | ----------- |
| GET    | `/api/tickets`                      | List with `q`, `status`, `priority`, `assigneeId`, `ownerId`, `page`, `size`, `sort` |
| POST   | `/api/tickets`                      | Create ticket |
| GET    | `/api/tickets/{id}`                 | Ticket detail |
| PATCH  | `/api/tickets/{id}`                 | Update subject/description/priority (owner while `OPEN`, or admin) |
| PATCH  | `/api/tickets/{id}/status`          | Change status (agent/admin; owner can close after resolved) |
| PATCH  | `/api/tickets/{id}/assign`          | Assign to an agent (agent/admin) |
| POST   | `/api/tickets/{id}/rating`          | Owner rates resolution (1–5) |

### Comments & Attachments
| Method | Path                                    | Description |
| ------ | --------------------------------------- | ----------- |
| GET    | `/api/tickets/{id}/comments`            | List comments |
| POST   | `/api/tickets/{id}/comments`            | Add comment |
| GET    | `/api/tickets/{id}/attachments`         | List attachments |
| POST   | `/api/tickets/{id}/attachments`         | Upload (multipart) |
| GET    | `/api/attachments/{id}`                 | Download |

### Admin
| Method | Path                       | Description |
| ------ | -------------------------- | ----------- |
| GET    | `/api/users`               | List all users |
| GET    | `/api/users/agents`        | List support agents (used by assignment UI) |
| POST   | `/api/users`               | Create user with any role |
| PATCH  | `/api/users/{id}/role`     | Change role |
| DELETE | `/api/users/{id}`          | Soft-disable user |

---

## 🔐 Security model

| Resource              | USER                        | SUPPORT_AGENT                     | ADMIN |
| --------------------- | --------------------------- | --------------------------------- | ----- |
| View tickets          | Only own                    | All                               | All |
| Create tickets        | ✅                          | ✅                                | ✅ |
| Edit ticket details   | Own ticket while `OPEN`     | —                                 | Any ticket |
| Change status         | Own: `RESOLVED → CLOSED`    | Any                               | Any (free transitions) |
| Assign tickets        | —                           | Any                               | Any |
| Comment               | Own ticket (until `CLOSED`) | Any (until `CLOSED`)              | Any (until `CLOSED`) |
| Rate resolution       | Own ticket only             | —                                 | — |
| User management       | —                           | —                                 | Full |

Status transitions enforced server-side:

```
OPEN  ──► IN_PROGRESS  ──► RESOLVED  ──► CLOSED
  │                           │
  └────────► CLOSED ◄─────────┘
       (admins can override and skip steps)
```

---

## 🛠️ Configuration

Backend env vars / properties:

| Property                    | Default                                  | Notes |
| --------------------------- | ---------------------------------------- | ----- |
| `JWT_SECRET`                | (built-in dev secret)                    | base64-encoded HMAC key, min 32 bytes; **change in production** |
| `app.jwt.expiration-ms`     | `86400000` (24 h)                        | Token lifetime |
| `app.upload.dir`            | `./uploads`                              | Where attachments are saved |
| `app.mail.enabled`          | `false`                                  | Toggle email notifications |
| `MAIL_HOST` / `MAIL_PORT`   | `localhost` / `1025`                     | SMTP (defaults work with [MailHog](https://github.com/mailhog/MailHog)) |
| `CORS_ORIGINS`              | `http://localhost:3000`                  | Comma-separated allow-list |

Frontend env (`.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🧪 Tests

A smoke test that boots the Spring context is included. Run all tests with:

```bash
cd backend
mvn test
```

---

## 🎯 Design notes

- **Stateless JWT** — no server-side session store, so the API scales horizontally without sticky sessions.
- **JPA Specifications** for the search endpoint — keeps the query builder typesafe and lets us combine optional filters cleanly.
- **Service-layer authorization** — `@PreAuthorize` handles coarse role gates, while ownership and lifecycle checks live in `TicketService` where they can throw structured exceptions that the global handler maps to clean JSON.
- **Soft-delete for users** — disabling a user preserves their tickets and comment history rather than orphaning rows.
- **UUID-prefixed file storage** — defeats path traversal, avoids name collisions, and keeps the original filename only as display metadata.
- **Async email** — the request thread never blocks on SMTP, and a mail-server outage logs a warning instead of failing the API call.

---

## 📝 What I'd add next

- WebSocket push so users see assignment/status changes without refreshing.
- Audit log of every status change and assignment for compliance.
- Saved searches and email digests.
- Agent SLA dashboards (avg time to first response, time to resolution).
- Refresh tokens (currently a single 24-hour access token).
#
