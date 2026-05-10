# CLAUDE.md — Topline Academy MVP (Engineering Handover)

You are taking over an in-progress Next.js project as a senior engineering team.
Operate as a coordinated multi-agent system. **Do NOT restart from scratch.**
Preserve existing patterns, files, and conventions unless they are demonstrably broken.

---

## 1. PROJECT IDENTITY

**Product:** Topline Academy — a branded online classroom platform for Pakistani students.
**Type:** MVP (Minimum Viable Product), not a generic LMS.
**Primary audience:** Pakistan. Optimize for 4G connections, 720p video, Chrome on Android.
**Currency:** PKR. **Timezone:** Asia/Karachi (PKT, UTC+5, no DST).
**Languages:** English UI, must render Urdu Unicode in content fields.

**Brand:**
- Name: "Topline Academy" — visible on every page, footer, and email.
- Primary color: Teal / Dark Green (`#0F7E7E` or close).
- Accent: Gold / Amber.
- Footer: `© 2026 Topline Academy · Pakistan`.

---

## 2. CONFIRMED TECH STACK (single source of truth)

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router) + TypeScript strict mode |
| Styling | Tailwind CSS + shadcn/ui |
| DB | Supabase (PostgreSQL) — accessed via Prisma (already set up) |
| Auth | Supabase Auth (consolidate — see §6) |
| Live video | Daily.co |
| Email | Resend |
| File storage | Supabase Storage (private bucket for payment proofs) |
| Hosting | Vercel |

**REMOVED FROM STACK — DO NOT USE:**
- ❌ Notion / `@notionhq/client` / `src/lib/notion.ts` — **delete entirely**.
- ❌ Custom JWT alongside Supabase Auth — pick Supabase Auth, remove the custom one.
- ❌ Zoom / Google Meet integrations — Daily.co is the only video provider.

---

## 3. USER ROLES (exactly three)

1. **Student** — registers, browses classes, requests enrollment + uploads payment proof, joins approved classes, watches replays, sees attendance history.
2. **Instructor** — assigned by admin, creates/manages own classes, uploads recorded videos, marks attendance after live sessions.
3. **Admin** — full control. Approves enrollments after verifying payment proof. Manages users, instructors, classes.

---

## 4. CORRECT USER JOURNEY (the current code gets this wrong — fix it)

### Student enrollment flow (THIS IS THE CRITICAL FIX)

**The current `POST /api/classes/[id]/enroll` skips Steps A and B entirely. Rebuild it to require `payment_proof_url`. Reject the request if missing.**

### Live class join flow
- Join button enabled **only** if: `enrollment.status === 'APPROVED'` AND current time is within 15 min before scheduled start until end.
- Server route `/api/classes/[id]/join` issues a Daily meeting token bound to user role + name. Never expose `DAILY_API_KEY` to client.

### Recorded class flow
- After approval, student sees the embedded video (uploaded MP4 via Supabase Storage, OR YouTube/Vimeo embed).

---

## 5. AGENT STRUCTURE (operate as these specialized roles)

For every task, identify which agents own it and produce their outputs.

1. **PM Agent** — maintains roadmap, sprint plan, risk log.
2. **Architecture Agent** — preserves patterns, flags tech debt, owns folder structure.
3. **Frontend Agent** — Next.js pages, shadcn/ui components, responsive layouts, branding.
4. **Backend Agent** — Prisma schema, Supabase RLS, API routes, migrations.
5. **API Integration Agent** — Daily.co, Resend, Supabase Storage; retries, error envelopes.
6. **Auth & Security Agent** — Supabase Auth, RLS policies, role guards, route protection.
7. **Video Agent** — Daily room lifecycle, tokens, reconnection, 15-min pre-join window.
8. **Email Agent** — Resend templates: welcome, enrollment-pending, approved, rejected, 1-hour class reminder. All branded with Topline Academy header + footer.
9. **QA Agent** — manual test scripts for every flow, regression list.
10. **Automated Testing Agent** — Vitest + React Testing Library + Playwright. E2E for: register → enroll → upload proof → admin approve → join live class.
11. **Performance Agent** — Lighthouse target ≥85 mobile, image optimization, query indexes.
12. **DevOps Agent** — Vercel env vars, Supabase migrations in CI, monitoring.

---

## 6. KNOWN ISSUES TO FIX (priority order)

1. **🔴 P0 — Remove Notion entirely.** Delete `src/lib/notion.ts`, remove `syncEnrollmentToNotion` and `updateEnrollmentStatusInNotion` calls in `api/classes/[id]/enroll/route.ts` and `api/admin/enrollments/[id]/route.ts`. Remove `@notionhq/client` from package.json. Remove `NOTION_*` env vars from `.env.example`.
2. **🔴 P0 — Fix enrollment journey.** Implement payment instructions page + payment proof upload to Supabase Storage (private bucket, signed URLs for admin viewing). Block enrollment creation without proof.
3. **🔴 P0 — Consolidate auth.** Two auth systems coexist: Supabase Auth in `src/lib/middleware.ts` and custom JWT via `getSession()`. Pick **Supabase Auth** as the single source. Migrate `getSession()` callers to read from Supabase session. Remove `JWT_SECRET` from env.
4. **🟠 P1 — Add RLS policies** on every Supabase table: `users`, `classes`, `enrollments`, `attendance`, `notifications`. Students see only their own enrollments; instructors see only enrolled students for their own classes; admins see all.
5. **🟠 P1 — PKT timezone correctness.** Store all times in UTC. Display via `Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi' })`. Audit every date render.
6. **🟠 P1 — Pakistani phone validation** (`+92` or `03xx-xxxxxxx` format) on registration.
7. **🟡 P2 — Email reminder cron** (1 hour before live class, approved students only). Use Vercel Cron + Resend.
8. **🟡 P2 — Attendance marking UI** for instructor after live class ends.
9. **🟡 P2 — Admin dashboard stats** (total students, pending enrollments, classes this week).
10. **🟢 P3 — Test suite + CI** as defined in §5 agent #10.

---

## 7. EXECUTION RULES (non-negotiable)

1. **Never rewrite a stable module unnecessarily.** If something works, leave it.
2. **Before coding any task**, output:
   - What already exists (file paths + summary)
   - What is missing or broken
   - A 3–7 step continuation plan
   - Then code only the gap.
3. **Reuse** existing components/hooks/services. No duplicate logic.
4. **Folder conventions** already established: `src/app/...` for routes, `src/components/...` for UI, `src/lib/...` for utilities. Keep this.
5. **TypeScript strict mode.** No `any` without a `// reason` comment.
6. **Every API route returns** `{ data, error }` envelope with HTTP codes that match.
7. **Every new feature ships with at least:** unit tests for pure logic, integration tests for API routes, and updated docs in `/docs`.
8. **No secrets in client code.** `DAILY_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_KEY` are server-only.
9. **Mobile-responsive by default.** Test at 360px width.
10. **Accessibility:** semantic HTML, alt text, keyboard navigation, focus states.

---

## 8. FIRST DELIVERABLE — RUN THIS NOW

Before writing any feature code, produce these artifacts in `/docs/handover/`:

1. `01-existing-audit.md` — list every file under `src/`, what it does, status (working / broken / partial).
2. `02-completed-features.md` — what is shippable today.
3. `03-incomplete-features.md` — what's started but broken, plus what's missing entirely.
4. `04-architecture-analysis.md` — patterns, layers, data flow diagram.
5. `05-tech-debt.md` — Notion removal scope, dual-auth issue, missing RLS, etc.
6. `06-api-audit.md` — every route, method, auth requirement, request/response shape.
7. `07-security-audit.md` — RLS gaps, exposed secrets, input validation gaps.
8. `08-test-coverage.md` — what's tested, what isn't.
9. `09-sprint-plan.md` — 3 sprints, each with goals + tasks + owning agents.
10. `10-priority-fixes.md` — P0/P1/P2/P3 list, ordered, with effort estimates.
11. `11-agent-task-board.md` — task assignments per agent from §5.

Then stop and wait for my approval before starting Sprint 1.

---

## 9. DEFINITION OF DONE (per task)

- Code compiles, lints clean, types pass.
- Tests added and green.
- Manual test script in `/docs/qa/` updated.
- No console errors in browser, no warnings in build.
- Mobile (360px) and desktop (1440px) both look correct.
- No secrets leaked client-side.
- Branded with Topline Academy where user-facing.

---

