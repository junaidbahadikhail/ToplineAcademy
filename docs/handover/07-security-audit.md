# 07 — Security Audit

---

## Critical

### SEC-01: No Payment Verification Before Enrollment Approval
- Students enroll without uploading payment proof
- Admin has nothing to verify before approving
- **Risk:** Free access to paid classes
- **Fix:** Require `paymentProofUrl` at enrollment; store in private Supabase Storage bucket; admin views via signed URL

### SEC-02: Daily.co Room Access Uncontrolled
- The Daily.co room URL is derived from `meetLink` (`tl-{base36timestamp}`)
- Anyone who discovers the room name can join via `https://{DAILY_DOMAIN}/{roomName}`
- No meeting token, no identity check, no enrollment check
- **Risk:** Non-enrolled users can join paid live classes
- **Fix:** Server-side Daily.co meeting token generation per `/api/classes/[id]/join`; validate enrollment + time window before issuing token

### SEC-03: No Supabase RLS Policies
- Prisma is the only data access gate; Supabase JS client has no restrictions
- If `SUPABASE_ANON_KEY` leaks (it's in env vars on Vercel), any user can query Supabase directly
- **Risk:** Full database read/write with leaked anon key
- **Fix:** Implement RLS on all tables before enabling any direct client-side Supabase queries

### SEC-04: Stale Session After User Deactivation
- `GET /api/auth/me` returns the JWT payload without a DB lookup
- If admin sets `user.isActive = false`, the JWT remains valid for 7 days
- **Risk:** Deactivated user continues to access protected routes
- **Fix:** Add DB lookup in `getSession()` or `/api/auth/me`; short-lived tokens + refresh

---

## High

### SEC-05: Instructor Role Self-Assignable at Registration
- `POST /api/auth/register` reads `role` from request body
- Client can send `{ role: "INSTRUCTOR" }` (the UI supports this intentionally)
- However, `role: "ADMIN"` could also be sent — the route does not guard against it
- Current code: `const assignedRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT'` — this is safe for ADMIN but trusts client for INSTRUCTOR
- **Risk:** Low for ADMIN (guarded), none for INSTRUCTOR (intentional design)
- **Recommendation:** Document this is by design; add comment in code

### SEC-06: No Rate Limiting on Auth Routes
- `POST /api/auth/login` has no rate limit or lockout
- **Risk:** Brute-force password attacks
- **Fix:** Vercel Edge Middleware rate limiting or `upstash/ratelimit`

### SEC-07: JWT Secret Has a Weak Fallback
- `src/lib/auth.ts`: `const secret = process.env.JWT_SECRET || 'topline-academy-secret'`
- If `JWT_SECRET` is not set in an environment, tokens are signed with a publicly known secret
- **Risk:** Anyone can forge valid session tokens in dev/staging if env var is missing
- **Fix:** Throw instead of falling back: `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set')`

---

## Medium

### SEC-08: `SUPABASE_SERVICE_KEY` Exposed in `src/lib/supabase.ts`
- `supabaseAdmin` client is instantiated with `SUPABASE_SERVICE_KEY` in `src/lib/supabase.ts`
- This file is a server-side lib file and is never imported client-side — currently safe
- **Risk:** If ever imported from a 'use client' component, the service key would be bundled
- **Fix:** Add `import 'server-only'` guard at top of this file

### SEC-09: No Input Sanitization on Free-Text Fields
- `title`, `subject`, `description`, `name` fields go directly into Prisma queries (parameterized — SQL injection safe) but are rendered without sanitization
- Stored XSS is prevented by React's default escaping
- **Risk:** Low — React escapes by default; Prisma prevents SQL injection
- **Recommendation:** Add `zod` validation for field lengths and character sets

### SEC-10: Health Endpoint Leaks Service Configuration
- `GET /api/health` is unauthenticated and reveals which integrations are configured
- **Risk:** Reconnaissance — attacker learns which API keys are set
- **Fix:** Add ADMIN auth check, or at minimum return only `{ status: "ok" }` publicly

---

## Secrets Inventory

| Secret | Location | Server Only? | Notes |
|---|---|---|---|
| `DATABASE_URL` | `.env` | ✅ yes | Prisma only |
| `JWT_SECRET` | `.env` | ✅ yes | Custom auth — remove after Supabase Auth migration |
| `RESEND_API_KEY` | `.env` | ✅ yes | `src/lib/email.ts` server-only |
| `SUPABASE_ANON_KEY` | `.env` | ✅ yes (currently) | Should become `NEXT_PUBLIC_` if used client-side |
| `SUPABASE_SERVICE_KEY` | `.env` | ✅ yes | `src/lib/supabase.ts` — add `server-only` import |
| `DAILY_API_KEY` | `.env` | ✅ yes | `src/lib/daily-recording.ts` — never sent to client |
| `OPENAI_API_KEY` | `.env` | ✅ yes | `src/lib/meeting-processor.ts` |
| `NOTION_*` | `.env` | ✅ yes | To be removed (TD-01) |
| `NEXT_PUBLIC_DAILY_DOMAIN` | `.env` | ❌ public | Acceptable — just the domain name |
| `NEXT_PUBLIC_DAILY_ROOM` | `.env` | ❌ public | Acceptable — demo room name |
| `NEXT_PUBLIC_APP_URL` | `.env` | ❌ public | Acceptable |
