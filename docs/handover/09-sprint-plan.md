# 09 — Sprint Plan

3 sprints. Stop after each sprint for review.

---

## Sprint 1 — Foundation Cleanup (P0 debt)
**Goal:** Remove everything that contradicts the spec. No new features. Codebase is clean and trustworthy by end.
**Duration:** 3–4 days

| # | Task | Owner Agent | Effort |
|---|---|---|---|
| S1-01 | Remove Notion entirely: delete `notion.ts`, remove all 5 callers, uninstall `@notionhq/client`, remove `NOTION_*` env vars | Backend | S |
| S1-02 | Remove `meeting-processor.ts` Notion export; replace with Supabase-only storage | Backend | S |
| S1-03 | Remove unused packages: `bcrypt`, `nodemailer` | DevOps | XS |
| S1-04 | Fix weak JWT secret fallback: throw if `JWT_SECRET` missing | Auth & Security | XS |
| S1-05 | Add `import 'server-only'` to `supabase.ts` | Auth & Security | XS |
| S1-06 | Add Pakistani phone validation (client + server) | Backend + Frontend | S |
| S1-07 | Fix `/api/auth/me` to return `name` from DB (not just JWT payload) | Backend | XS |
| S1-08 | Protect `GET /api/health` behind ADMIN auth | Backend | XS |
| S1-09 | Delete `src/lib/client.ts`, `src/lib/server.ts`, `src/lib/middleware.ts` (broken scaffolding) | Architecture | XS |
| S1-10 | Build profile page: fetch real data, add PATCH `/api/users/me` | Frontend + Backend | M |

**Sprint 1 Definition of Done:**
- `npm run build` passes with zero warnings
- Notion package not in `node_modules`
- No Notion imports anywhere in codebase
- Profile page shows real logged-in user data

---

## Sprint 2 — Critical Business Logic (P0–P1 features)
**Goal:** Enrollment works correctly with payment proof. Live class join is access-controlled.
**Duration:** 5–6 days

| # | Task | Owner Agent | Effort |
|---|---|---|---|
| S2-01 | Create Supabase Storage private bucket `payment-proofs` | DevOps + Backend | S |
| S2-02 | `POST /api/storage/payment-proof` — issues signed upload URL | Backend | S |
| S2-03 | Payment proof upload UI on class detail page | Frontend | M |
| S2-04 | Require `paymentProofUrl` in `POST /api/classes/[id]/enroll`; reject if missing | Backend | S |
| S2-05 | Admin enrollment card: show payment proof as signed download link | Frontend | S |
| S2-06 | `POST /api/classes/[id]/join` — verify enrollment + time window, issue Daily.co meeting token | Backend + Video | M |
| S2-07 | Update `DailyRoom` to accept token param instead of raw room URL | Frontend + Video | S |
| S2-08 | Implement 15-minute pre-join window check in join route | Video | S |
| S2-09 | Add RLS policies on all Supabase tables | Auth & Security | L |
| S2-10 | Instructor attendance marking UI + `POST /api/attendance/[classId]` | Frontend + Backend | M |
| S2-11 | Student attendance history on student dashboard | Frontend | S |

**Sprint 2 Definition of Done:**
- Enrollment rejected without payment proof screenshot
- Admin sees proof image before approving
- Enrolled students only can join live class (tested manually)
- RLS policies active and verified in Supabase dashboard

---

## Sprint 3 — Quality & Automation (P2–P3)
**Goal:** Test suite, email cron, recorded class support, performance baseline.
**Duration:** 4–5 days

| # | Task | Owner Agent | Effort |
|---|---|---|---|
| S3-01 | Vitest setup + unit tests for `auth.ts`, `demo-classes.ts` | Automated Testing | M |
| S3-02 | API integration tests for auth and enrollment routes | Automated Testing | L |
| S3-03 | Playwright E2E: student full journey | Automated Testing | L |
| S3-04 | Playwright E2E: admin approval flow | Automated Testing | M |
| S3-05 | Email reminder cron: `POST /api/cron/class-reminders` + Vercel cron config | Email + DevOps | M |
| S3-06 | RECORDED class support: video upload to Supabase Storage, embedded player | Frontend + Backend | L |
| S3-07 | Restore recording dashboard state on mount (fetch MeetingNote per class) | Frontend | S |
| S3-08 | Lighthouse audit — target ≥85 mobile | Performance | M |
| S3-09 | Add `zod` validation to all POST/PATCH body parsers | Backend | M |

**Sprint 3 Definition of Done:**
- `npm test` passes with ≥80% coverage on lib files
- E2E suite green in CI
- Lighthouse mobile score ≥85

---

## Effort Scale
- XS = < 1 hour
- S = 1–3 hours
- M = 3–6 hours
- L = 1–2 days
