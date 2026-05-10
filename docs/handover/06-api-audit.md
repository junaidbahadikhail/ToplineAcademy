# 06 — API Route Audit

Every route, method, auth requirement, and request/response shape.

Auth guard: `getSession()` reads `topline_session` JWT cookie.

---

## Auth Routes

### `POST /api/auth/register`
- **Auth:** None
- **Body:** `{ name, email, phone, city, password, role? }`
- **Response 201:** `{ success: true, user: { id, name, email, role } }`
- **Response 400:** `{ error: "..." }` — missing fields
- **Response 409:** `{ error: "This email is already registered." }`
- **Side effects:** `sendWelcomeEmail()` [fire-and-forget]
- **Issues:** No phone format validation; instructor role trusted from client body (no admin gate on role assignment)

### `POST /api/auth/login`
- **Auth:** None
- **Body:** `{ email, password }`
- **Response 200:** `{ success: true, user: { id, name, email, role } }` + sets `topline_session` cookie
- **Response 400/401/500:** `{ error: "..." }`
- **Issues:** No rate limiting; no lockout after failed attempts

### `POST /api/auth/logout`
- **Auth:** None (clears cookie regardless)
- **Response 200:** `{ success: true }`

### `GET /api/auth/me`
- **Auth:** JWT cookie required
- **Response 200:** `{ user: { userId, email, role } }` (JWT payload only — no name/phone from DB)
- **Response 401:** `{ error: "Unauthorized" }`
- **Issues:** Returns JWT payload, not a fresh DB fetch — stale if user is deactivated after login

---

## Class Routes

### `GET /api/classes`
- **Auth:** None
- **Response 200:** `Array<{ id, title, instructor: { name }, schedule, feePkr, type, status }>`
- **Behaviour:** Returns approved classes from DB; falls back to demo fixtures if DB empty

### `POST /api/classes`
- **Auth:** INSTRUCTOR or ADMIN
- **Body:** `{ title, subject, description?, scheduleTime, maxStudents, feePkr }`
- **Response 201:** Full Prisma `Class` object
- **Issues:** Still calls `syncClassToNotion()` (tech debt TD-01); type hardcoded to `LIVE`; no way to create RECORDED class

### `GET /api/classes/[id]`
- **Auth:** None (unapproved classes return 404 unless caller is ADMIN or the instructor)
- **Response 200:** `{ id, title, subject, description, instructor: { name }, scheduleTime, timezone, meetLink, videoUrl, feePkr, type, status, maxStudents, isApproved, isDemo? }`

### `PATCH /api/classes/[id]`
- **Auth:** INSTRUCTOR (own class) or ADMIN
- **Body:** `{ scheduleTime?, title?, subject?, description?, maxStudents?, feePkr? }`
- **Response 200:** Updated Prisma `Class` object

### `POST /api/classes/[id]/enroll`
- **Auth:** STUDENT
- **Body:** None (payment proof not required — **broken**)
- **Response 201:** Prisma `Enrollment` object
- **Response 400:** Demo class guard; ENDED/CANCELLED class guard
- **Response 409:** Already enrolled
- **Issues:** No `paymentProofUrl` required; still calls `syncEnrollmentToNotion()` (TD-01)

### `PATCH /api/classes/[id]/session`
- **Auth:** INSTRUCTOR (own class) or ADMIN
- **Body:** `{ action: "start" | "end" }`
- **Response 200:** Updated Prisma `Class` object

### `GET /api/classes/[id]/recording`
- **Auth:** Any logged-in user (returns null for unauthenticated)
- **Response 200:** `{ recordingId, summary, keyTopics[], actionItems[], importantNotes[], quizQuestions[], notionPageId, createdAt }` or `null`

### `POST /api/classes/[id]/recording`
- **Auth:** INSTRUCTOR (own class) or ADMIN
- **Body:** `{ action: "start" | "stop" | "process" }`
- **start response:** `{ recordingId, status: "started" }`
- **stop response:** `{ status: "stopped" }`
- **process response:** `{ status: "processed", summary, keyTopics[] }`
- **Issues:** `process` action can take several minutes (Whisper + GPT); no background job queue; HTTP timeout risk

---

## Dashboard Routes

### `GET /api/dashboard/student`
- **Auth:** Any logged-in user (no role check — any role can call)
- **Response 200:** `Array<Enrollment with class + instructor + _count>`

### `GET /api/dashboard/instructor`
- **Auth:** INSTRUCTOR or ADMIN
- **Response 200:** `Array<Class with _count.enrollments + approved enrollments>`

---

## Admin Routes

### `GET /api/admin/stats`
- **Auth:** ADMIN
- **Response 200:** `{ totalStudents, totalInstructors, pendingEnrollments, pendingClasses, totalClasses }`

### `GET /api/admin/users`
- **Auth:** ADMIN
- **Query:** `?role=ALL|STUDENT|INSTRUCTOR`
- **Response 200:** `Array<User with _count.enrollments>`

### `PATCH /api/admin/users/[id]`
- **Auth:** ADMIN
- **Body:** `{ isVerified?, isActive?, role? }`
- **Response 200:** Updated user
- **Side effects:** `sendInstructorApprovedEmail()` when `isVerified` flips true for INSTRUCTOR

### `GET /api/admin/enrollments`
- **Auth:** ADMIN
- **Query:** `?status=ALL|PENDING|APPROVED|REJECTED`
- **Response 200:** `Array<Enrollment with student + class>`

### `PATCH /api/admin/enrollments/[id]`
- **Auth:** ADMIN
- **Body:** `{ status: "APPROVED" | "REJECTED" }`
- **Response 200:** Updated enrollment with student + class
- **Side effects:** Approval/rejection email; `updateEnrollmentStatusInNotion()` (TD-01)

### `GET /api/admin/classes`
- **Auth:** ADMIN
- **Query:** `?status=ALL|PENDING|APPROVED`
- **Response 200:** `Array<Class with instructor>`

### `PATCH /api/admin/classes/[id]`
- **Auth:** ADMIN
- **Body:** `{ isApproved: boolean }`
- **Response 200:** `{ id, isApproved }`
- **Side effects:** `updateClassStatusInNotion()` (TD-01)

---

## Health Route

### `GET /api/health`
- **Auth:** None
- **Response 200:** `{ status: "ok", database, resend, daily, notion, openai }`
- **Values:** `connected|failed` / `healthy|failed|missing` / `reachable|failed|missing` / `configured|partially configured|missing`

---

## Missing Routes (per spec)

| Route | Purpose |
|---|---|
| `POST /api/classes/[id]/join` | Issue Daily.co meeting token with user identity |
| `POST /api/storage/payment-proof` | Get signed Supabase Storage upload URL |
| `POST /api/attendance/[classId]` | Instructor marks student attendance |
| `GET /api/attendance/[classId]` | Get attendance list for a class |
| `PATCH /api/users/me` | Student/instructor updates own profile |
| `POST /api/cron/class-reminders` | Called by Vercel Cron, sends 1-hour reminder emails |
