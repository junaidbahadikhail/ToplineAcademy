# 04 — Architecture Analysis

---

## Layer Map

```
Browser
  └─ Next.js App Router (Next.js 14.2.5)
       ├─ Pages (src/app/**/page.tsx)       — 'use client' components, fetch API routes
       ├─ API Routes (src/app/api/**/route.ts) — server-only, read JWT cookie, call Prisma
       └─ Components (src/components/)      — shared UI (SiteHeader, SiteFooter, DailyRoom)

Auth Layer (DUAL — see tech debt)
  ├─ ACTIVE:   src/lib/auth.ts + get-session.ts → custom JWT in topline_session cookie
  └─ INACTIVE: src/lib/middleware.ts + client.ts + server.ts → Supabase Auth scaffolding (not wired)

Data Layer
  └─ Prisma ORM → PostgreSQL on Supabase (xfredsmzymzhfjynltgx)
       All DB access goes through Prisma. Supabase JS client is NOT used for data queries.

External Services
  ├─ Daily.co  — video rooms (iframe) + cloud recording API
  ├─ Resend    — transactional email (6 templates)
  ├─ OpenAI    — Whisper transcription + GPT-4o-mini analysis
  └─ Notion    — CRM sync (TARGETED FOR REMOVAL)
```

---

## Data Flow: Student Enrollment (current — broken)

```
Student clicks "Enroll now"
  → POST /api/classes/[id]/enroll
  → getSession() verifies JWT cookie
  → prisma.enrollment.create() — NO payment proof required
  → sendEnrollmentConfirmationEmail() [fire-and-forget]
  → syncEnrollmentToNotion() [fire-and-forget, Notion — to be removed]
  → 201 Created
```

**Correct flow (per §4):**
```
Student uploads payment screenshot to Supabase Storage
  → receives signed upload URL from /api/storage/payment-proof
  → POST /api/classes/[id]/enroll { paymentProofUrl }
  → server validates URL is present and belongs to correct bucket
  → enrollment created with PENDING status
  → admin reviews payment proof via signed URL in admin dashboard
  → admin approves/rejects → email sent
```

---

## Data Flow: Live Class Join (current — no access control)

```
Instructor clicks "Start session" → PATCH /api/classes/[id]/session { action: "start" }
  → class.status = LIVE_NOW

Student sees "Join live session" button (approved enrollment + LIVE_NOW)
  → setJoining(true) in React state
  → DailyRoom renders iframe with: https://{DAILY_DOMAIN}/{roomName}
  → No token, no identity binding, no time check
```

**Correct flow (per §4):**
```
Student clicks "Join" → POST /api/classes/[id]/join
  → server verifies: enrollment APPROVED + time within [scheduleTime - 15min, ENDED]
  → server calls Daily.co API: /meeting-tokens with { room_name, is_owner: false, user_name }
  → returns { token } (not the raw room URL)
  → DailyRoom renders with token param, not URL
```

---

## Folder Conventions

```
src/app/                  Next.js App Router pages and API routes
src/app/api/              Server-only route handlers
src/components/           Shared client components
src/lib/                  Server utilities (prisma, auth, email, external APIs)
prisma/schema.prisma      Single source of truth for DB schema
docs/                     Engineering documentation
```

---

## Prisma Schema Summary

```
User          id, name, email (unique), phone, city, passwordHash, role, isVerified, isActive
Class         id, title, subject, description, instructorId→User, type, scheduleTime, timezone,
              meetLink, videoUrl, maxStudents, feePkr, status, isApproved
Enrollment    id, studentId→User, classId→Class, paymentProofUrl, status, approvedAt
              @@unique([studentId, classId])
Attendance    id, enrollmentId→Enrollment (unique), classId→Class, attended, markedAt
Notification  id, userId→User, message, type, isRead
MeetingNote   id, classId→Class (unique), recordingId, transcript, summary,
              keyTopics[], actionItems[], importantNotes[], quizQuestions[], notionPageId, duration
```

---

## Key Patterns

- **Auth guard pattern:** Every protected API route calls `getSession()` as first line; returns 401/403 immediately if invalid
- **Fire-and-forget side effects:** Email and Notion calls use `void fn()` so they never block the HTTP response
- **Demo class fallback:** `GET /api/classes` returns static demo fixtures when the DB has zero approved classes
- **Soft approval:** Classes default `isApproved: false`; only ADMIN sees unapproved classes; public listing filters to approved only
