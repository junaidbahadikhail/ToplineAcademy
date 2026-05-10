# 11 — Agent Task Board

Task assignments per agent from §5. Sprint 1 items are actionable now.

---

## 1. PM Agent

| Task | Sprint | Status |
|---|---|---|
| Maintain this task board — mark items as done as PRs merge | Ongoing | Active |
| Track Sprint 1 completion before Sprint 2 begins | S1 | Pending |
| Flag any scope creep or dependency blockers | Ongoing | Active |
| Update `09-sprint-plan.md` with actual completion dates | Ongoing | Pending |

---

## 2. Architecture Agent

| Task | Sprint | Status |
|---|---|---|
| Delete `src/lib/client.ts`, `src/lib/server.ts`, `src/lib/middleware.ts` (broken Supabase Auth scaffolding) | S1 | Pending |
| Enforce folder conventions — no new lib files without a clear owner | Ongoing | Active |
| Audit imports after Notion removal — ensure no orphaned imports | S1 | Pending |
| Document final auth architecture decision in `04-architecture-analysis.md` | S1 | Pending |

---

## 3. Frontend Agent

| Task | Sprint | Status |
|---|---|---|
| Profile page — real data fetch + editable fields + PATCH `/api/users/me` | S1 | Pending |
| Payment proof upload UI on class detail page | S2 | Pending |
| Admin enrollment card — signed URL payment proof link | S2 | Pending |
| Instructor attendance marking UI | S2 | Pending |
| Student attendance history on dashboard | S2 | Pending |
| RECORDED class embedded video player | S3 | Pending |
| Restore recording UI state on dashboard mount | S3 | Pending |
| Mobile audit at 360px on all pages | S3 | Pending |

---

## 4. Backend Agent

| Task | Sprint | Status |
|---|---|---|
| Delete `src/lib/notion.ts`, remove all callers, update package.json | S1 | **NEXT** |
| Remove Notion export from `meeting-processor.ts` | S1 | Pending |
| Remove `bcrypt`, `nodemailer` from `package.json` | S1 | Pending |
| Fix JWT secret weak fallback — throw if missing | S1 | Pending |
| `GET /api/auth/me` — add DB lookup to return user name | S1 | Pending |
| `GET /api/health` — require ADMIN auth | S1 | Pending |
| Pakistani phone validation in register route | S1 | Pending |
| `PATCH /api/users/me` — profile update endpoint | S1 | Pending |
| `POST /api/storage/payment-proof` — signed upload URL | S2 | Pending |
| Require `paymentProofUrl` in enroll route | S2 | Pending |
| `POST /api/attendance/[classId]` — mark attendance | S2 | Pending |
| `GET /api/attendance/[classId]` — fetch attendance | S2 | Pending |
| Add `zod` validation across all POST/PATCH routes | S3 | Pending |
| `POST /api/cron/class-reminders` | S3 | Pending |

---

## 5. API Integration Agent

| Task | Sprint | Status |
|---|---|---|
| Daily.co meeting token endpoint `POST /api/classes/[id]/join` | S2 | Pending |
| Supabase Storage bucket creation (`payment-proofs`, private) | S2 | Pending |
| Verify `OPENAI_API_KEY` is set and test recording pipeline end-to-end | S1 | Pending |

---

## 6. Auth & Security Agent

| Task | Sprint | Status |
|---|---|---|
| Throw on missing `JWT_SECRET` (not default fallback) | S1 | Pending |
| Add `import 'server-only'` to `src/lib/supabase.ts` | S1 | Pending |
| Add `/admin` page redirect guard for unauthenticated users | S1 | Pending |
| Add role check to `/api/dashboard/student` | S1 | Pending |
| Write Supabase RLS policies — all 6 tables | S2 | Pending |
| Verify RLS policies with Supabase dashboard policy tester | S2 | Pending |

---

## 7. Video Agent

| Task | Sprint | Status |
|---|---|---|
| Implement `POST /api/classes/[id]/join` — Daily.co meeting token | S2 | Pending |
| Update `DailyRoom` component to accept `token` prop | S2 | Pending |
| Enforce 15-minute pre-join window in join route | S2 | Pending |
| Test Daily.co reconnection on network drop | S3 | Pending |

---

## 8. Email Agent

| Task | Sprint | Status |
|---|---|---|
| Verify all 6 email templates render correctly with real Resend API | S1 | Pending |
| Add `sendSessionStartingEmail` call to cron route | S3 | Pending |
| Vercel Cron config for 1-hour class reminder | S3 | Pending |

---

## 9. QA Agent

| Task | Sprint | Status |
|---|---|---|
| Write manual test scripts for every flow to `docs/qa/` | S1 | Pending |
| Execute regression checklist after Sprint 1 merges | S1 | Pending |
| Document known gaps that E2E must cover | S2 | Pending |

---

## 10. Automated Testing Agent

| Task | Sprint | Status |
|---|---|---|
| Set up Vitest + React Testing Library | S3 | Pending |
| Unit tests: `auth.ts`, `demo-classes.ts` | S3 | Pending |
| Integration tests: auth routes, enrollment routes | S3 | Pending |
| Set up Playwright | S3 | Pending |
| E2E: student full journey | S3 | Pending |
| E2E: admin approval flow | S3 | Pending |
| Add `test` and `test:e2e` to CI | S3 | Pending |

---

## 11. Performance Agent

| Task | Sprint | Status |
|---|---|---|
| Lighthouse mobile audit — baseline measurement | S3 | Pending |
| Image optimization audit (Next.js Image component where needed) | S3 | Pending |
| Add DB indexes for common query patterns (`enrollments.studentId`, `classes.scheduleTime`) | S3 | Pending |
| Target: Lighthouse mobile ≥85 | S3 | Pending |

---

## 12. DevOps Agent

| Task | Sprint | Status |
|---|---|---|
| Remove `NOTION_*` env vars from `.env` and Vercel dashboard | S1 | Pending |
| Add `OPENAI_API_KEY` to Vercel production env vars | S1 | Pending |
| Verify all required env vars are set in Vercel | S1 | Pending |
| Set up Supabase Storage private bucket `payment-proofs` | S2 | Pending |
| Configure Vercel Cron for email reminders | S3 | Pending |
| Set up Supabase migrations in CI | S3 | Pending |
