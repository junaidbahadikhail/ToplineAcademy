# 01 — Existing File Audit

Every file under `src/`, what it does, and its current status.

Legend: ✅ working · ⚠️ partial · ❌ broken · 🔴 needs deletion

---

## Pages (`src/app/`)

| File | Purpose | Status |
|---|---|---|
| `app/page.tsx` | Marketing homepage | ✅ working |
| `app/layout.tsx` | Root layout, global CSS, SiteFooter | ✅ working |
| `app/globals.css` | Tailwind base | ✅ working |
| `app/login/page.tsx` | Login form with redirect, Suspense boundary | ✅ working |
| `app/register/page.tsx` | Registration form (student/instructor toggle) | ⚠️ partial — no phone validation, no redirect to login after success |
| `app/classes/page.tsx` | Public class listing with demo fallback | ✅ working |
| `app/classes/[id]/page.tsx` | Class detail + enrollment panel + meeting notes | ⚠️ partial — no payment proof upload UI, no 15-min join window enforcement |
| `app/dashboard/page.tsx` | Role-based redirect hub | ✅ working |
| `app/dashboard/student/page.tsx` | Student's enrolled classes list | ⚠️ partial — no attendance history, no replay access for ENDED classes |
| `app/dashboard/instructor/page.tsx` | Instructor class management + recording controls | ⚠️ partial — no attendance marking UI, recording state resets on page reload |
| `app/admin/page.tsx` | Admin dashboard (users, enrollments, classes, health) | ✅ working |
| `app/profile/page.tsx` | Profile page | ❌ broken — hardcoded placeholder data, no real data fetch, no edit capability |

---

## API Routes (`src/app/api/`)

| Route | Methods | Status |
|---|---|---|
| `api/auth/register` | POST | ✅ working |
| `api/auth/login` | POST | ✅ working |
| `api/auth/logout` | POST | ✅ working |
| `api/auth/me` | GET | ✅ working |
| `api/classes` | GET, POST | ⚠️ partial — POST still calls Notion (see tech debt) |
| `api/classes/[id]` | GET, PATCH | ✅ working |
| `api/classes/[id]/enroll` | POST | ❌ broken — accepts enrollment with no payment proof; still imports and calls Notion |
| `api/classes/[id]/session` | PATCH | ✅ working |
| `api/classes/[id]/recording` | GET, POST | ⚠️ partial — requires OPENAI_API_KEY not yet configured |
| `api/dashboard/student` | GET | ✅ working |
| `api/dashboard/instructor` | GET | ✅ working |
| `api/admin/stats` | GET | ✅ working |
| `api/admin/users` | GET | ✅ working |
| `api/admin/users/[id]` | PATCH | ✅ working |
| `api/admin/enrollments` | GET | ✅ working |
| `api/admin/enrollments/[id]` | PATCH | ⚠️ partial — still imports and calls Notion |
| `api/admin/classes` | GET | ✅ working |
| `api/admin/classes/[id]` | PATCH | ⚠️ partial — still imports and calls Notion |
| `api/health` | GET | ✅ working |

---

## Components (`src/components/`)

| File | Purpose | Status |
|---|---|---|
| `SiteHeader.tsx` | Auth-aware nav with role badge, login/logout | ✅ working |
| `SiteFooter.tsx` | Branded footer `© 2026 Topline Academy` | ✅ working |
| `DailyRoom.tsx` | Daily.co iframe via `@daily-co/daily-js` | ⚠️ partial — unauthenticated public URL, no token-based join, no 15-min pre-join window |

---

## Libraries (`src/lib/`)

| File | Purpose | Status |
|---|---|---|
| `auth.ts` | Custom JWT sign/verify + bcryptjs password hashing | ✅ working (but targeted for removal per §6 P0) |
| `prisma.ts` | PrismaClient singleton | ✅ working |
| `get-session.ts` | Reads `topline_session` cookie, verifies JWT | ✅ working (depends on custom auth; targeted for removal) |
| `supabase.ts` | Supabase JS client (anon + admin) | ⚠️ partial — not used anywhere in active code; references correct env vars |
| `client.ts` | Supabase browser client (`@supabase/ssr`) | ❌ broken — references `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` which does not exist in `.env` |
| `server.ts` | Supabase server client (`@supabase/ssr`) | ❌ broken — same missing env var; `cookies()` called without `await` (Next.js 14 issue) |
| `middleware.ts` | Supabase session refresh middleware | ❌ broken — not wired as Next.js root middleware; references missing env var; `supabase.auth.getClaims()` is not a real Supabase JS v2 method |
| `email.ts` | 6 branded Resend email templates | ✅ working |
| `demo-classes.ts` | Static demo class fixtures with live status calculation | ✅ working |
| `daily-recording.ts` | Daily.co cloud recording API wrapper | ✅ working |
| `meeting-processor.ts` | Whisper transcription + GPT-4o-mini analysis + Notion export | ⚠️ partial — requires `OPENAI_API_KEY` (not configured); Notion export still present |
| `notion.ts` | Notion CRM sync functions | 🔴 targeted for deletion per §2 and §6 P0 |
