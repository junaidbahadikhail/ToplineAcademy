# 10 — Priority Fixes

Ordered P0 → P3. Each item has an effort estimate and the primary risk if skipped.

---

## P0 — Launch Blocker

| ID | Fix | Effort | Risk if Skipped |
|---|---|---|---|
| P0-01 | **Remove Notion** — delete `notion.ts`, remove 5 callers, uninstall `@notionhq/client` | 1h | Code calls dead integration; crashes if Notion env vars absent |
| P0-02 | **Payment proof required on enrollment** — Supabase Storage bucket + upload UI + server validation | 1–2 days | Students get free access to paid classes |
| P0-03 | **Daily.co meeting token** — `POST /api/classes/[id]/join`, stop exposing raw room URL | 4h | Non-enrolled users can join live classes |
| P0-04 | **Fix JWT secret fallback** — throw instead of defaulting to hardcoded string | 30min | Forged tokens valid in any env missing `JWT_SECRET` |

---

## P1 — Soft-Launch Blocker

| ID | Fix | Effort | Risk if Skipped |
|---|---|---|---|
| P1-01 | **Supabase RLS** — policies on all 6 tables | 1 day | Direct Supabase queries expose all data |
| P1-02 | **15-min pre-join window** — time gate in join route | 1h | Students can "join" past or future sessions |
| P1-03 | **Phone validation** — `+92`/`03xx` regex on client + server | 1h | Bad data in phone column; SMS/calling fails |
| P1-04 | **Profile page** — fetch real data + PATCH endpoint | 3h | Profile shows hardcoded placeholder for all users |
| P1-05 | **Add `server-only` to `supabase.ts`** | 15min | Service key accidentally bundled client-side |
| P1-06 | **`/api/auth/me` returns name from DB** | 30min | Header shows `undefined` for name if JWT payload lacks it |
| P1-07 | **Attendance marking** — instructor UI + API route | 4h | Attendance table permanently empty |
| P1-08 | **Remove unused packages** (`bcrypt`, `nodemailer`) | 15min | False deps; bcrypt types mismatch with bcryptjs |

---

## P2 — Production Quality

| ID | Fix | Effort | Risk if Skipped |
|---|---|---|---|
| P2-01 | **Email reminder cron** — Vercel Cron + `POST /api/cron/class-reminders` | 3h | No 1-hour reminder for students |
| P2-02 | **Recorded class video** — upload flow + embedded player | 1 day | `type: RECORDED` is dead; no replay access |
| P2-03 | **Recording UI state on reload** — fetch MeetingNote on mount | 1h | Instructor loses recording phase context |
| P2-04 | **Health endpoint auth** — require ADMIN | 30min | Service configuration exposed to public |
| P2-05 | **`/admin` route guard** — redirect unauthenticated users to `/login` | 30min | Admin page renders empty for anonymous users instead of redirecting |
| P2-06 | **`/dashboard/student` role check** — `/api/dashboard/student` has no role guard | 15min | Any logged-in user (instructor/admin) can call student dashboard API |

---

## P3 — Quality of Life

| ID | Fix | Effort | Risk if Skipped |
|---|---|---|---|
| P3-01 | **Test suite** — Vitest + Playwright | 3 days | Regressions caught only in prod |
| P3-02 | **`zod` request validation** — replace manual checks | 1 day | Inconsistent error messages; edge-case crashes |
| P3-03 | **Lighthouse ≥85 mobile** — image optimization, query indexes | 1 day | Poor performance on 4G Pakistan connections |
| P3-04 | **Delete Supabase Auth scaffolding** (`client.ts`, `server.ts`, `middleware.ts`) | 15min | Dead broken code causes confusion |
| P3-05 | **`tsconfig.tsbuildinfo` gitignore** | 5min | Build artifact noise in commits |
