# 05 — Tech Debt Register

Ordered by severity.

---

## P0 — Blocking / Must Fix Before Launch

### TD-01: Notion Still Wired (§2 explicitly bans it)
- `src/lib/notion.ts` — full Notion client, 4 exported functions
- `@notionhq/client` in `package.json`
- Active callers:
  - `api/classes/[id]/enroll/route.ts` → `syncEnrollmentToNotion()`
  - `api/admin/enrollments/[id]/route.ts` → `updateEnrollmentStatusInNotion()`
  - `api/admin/classes/[id]/route.ts` → `updateClassStatusInNotion()`
  - `api/classes/route.ts` → `syncClassToNotion()`
  - `lib/meeting-processor.ts` → `saveMeetingNotesToNotion()`
- `NOTION_*` env vars in `.env`
- **Fix:** Delete `notion.ts`, remove all 5 import/call sites, uninstall package, remove env vars

### TD-02: Dual Authentication Systems
- **Active:** Custom JWT in `src/lib/auth.ts` + `src/lib/get-session.ts`; cookie `topline_session`; uses `jsonwebtoken` + `bcryptjs`
- **Scaffolded but broken:** `src/lib/middleware.ts` + `src/lib/client.ts` + `src/lib/server.ts` — Supabase Auth via `@supabase/ssr`; references `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env var which does not exist in `.env` (env has `SUPABASE_ANON_KEY`)
- `src/lib/middleware.ts` is not wired as Next.js root middleware (no `src/middleware.ts`)
- `supabase.auth.getClaims()` in `middleware.ts` is not a real method in `@supabase/supabase-js` v2
- **Fix per §6 P0:** Pick Supabase Auth. Migrate all `getSession()` callers. Remove `auth.ts`, `get-session.ts`, `JWT_SECRET`. Create real `src/middleware.ts` wrapping `updateSession`. Wire Supabase Auth login/register.

### TD-03: Enrollment Accepts No Payment Proof
- `POST /api/classes/[id]/enroll` creates an enrollment record with no verification that payment was made
- `paymentProofUrl` column exists in schema but is never written
- Admin has no way to verify payment before approving
- **Fix:** Add Supabase Storage bucket, upload endpoint, require `paymentProofUrl` in enrollment POST body

---

## P1 — Important / Fix Before Soft Launch

### TD-04: No Supabase RLS
- Zero row-level security policies on any table
- If a client ever calls Supabase JS directly (not via Prisma), all rows are exposed
- Any leaked `SUPABASE_ANON_KEY` gives read/write access to entire database
- **Fix:** Write RLS policies: students see own enrollments; instructors see enrolled students for own classes; admins unrestricted; public sees approved classes only

### TD-05: Broken Supabase Client Files
- `src/lib/client.ts` and `src/lib/server.ts` reference `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- This key does not exist in `.env` (actual key is `SUPABASE_ANON_KEY`)
- If imported anywhere, it will fail silently (empty URL)
- Currently not imported by any active route — dead code
- **Fix:** Either wire correctly (rename env var or update references) or delete if not needed after auth migration

### TD-06: No Pakistani Phone Validation
- Registration accepts any string in `phone` field
- No regex check on client or server for `+92...` or `03xx-xxxxxxx`
- **Fix:** Add validation in `register/page.tsx` and `api/auth/register/route.ts`

### TD-07: `LIVE_NOW` Join Window Not Enforced
- Students can join any LIVE_NOW class regardless of schedule time
- No 15-minute pre-join window
- **Fix:** Add time gate in `/api/classes/[id]/join` route

### TD-08: Daily.co Room Access Uncontrolled
- DailyRoom iframe uses raw public URL — no token, no identity
- Non-enrolled users can join if they know the room name
- **Fix:** Implement `/api/classes/[id]/join` with Daily.co meeting token API

---

## P2 — Quality / Fix After Launch

### TD-09: Duplicate/Unused Packages
- `bcrypt` AND `bcryptjs` both installed — only `bcryptjs` is used in `auth.ts`
- `nodemailer` installed but never used (Resend handles email)
- These inflate bundle and create maintenance confusion
- **Fix:** `npm uninstall bcrypt nodemailer`

### TD-10: Recording UI State Not Persisted
- `recordings` state in instructor dashboard is in-memory React state
- Loses recording phase on page reload; no re-fetch of `MeetingNote` on mount
- **Fix:** On component mount, fetch `/api/classes/[id]/recording` for each class and restore UI state

### TD-11: Profile Page Is a Stub
- Hardcoded name and email
- No PATCH endpoint for profile updates
- **Fix:** Fetch from `/api/auth/me`, add `PATCH /api/users/me` route

### TD-12: No Email Reminder Cron
- `sendSessionStartingEmail` template exists but is never called
- Requires Vercel Cron job + protected API route
- **Fix:** Add `POST /api/cron/class-reminders` + Vercel cron config in `vercel.json`

### TD-13: `meeting-processor.ts` Still Imports Notion
- `saveMeetingNotesToNotion` is called from the recording route
- Blocked by TD-01 but deserves its own entry
- **Fix:** Remove Notion export from `meeting-processor.ts` after TD-01

---

## P3 — Nice to Have

### TD-14: No Test Suite
- Zero tests. No Vitest config, no Playwright config.
- **Fix:** Implement as described in Sprint 3

### TD-15: shadcn/ui Not Used
- `Claude.md` spec lists shadcn/ui as the component library
- All UI is hand-rolled Tailwind — consistent but not using the specified library
- **Fix:** Evaluate whether to adopt shadcn/ui or formally remove it from spec

### TD-16: `tsconfig.tsbuildinfo` in Git
- Build artifact tracked in git (currently in `.gitignore` via pattern but showing modified)
- Causes noise in diffs
