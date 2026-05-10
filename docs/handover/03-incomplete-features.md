# 03 — Incomplete & Missing Features

---

## Started but Broken

### Payment Proof Upload
- **What exists:** `paymentProofUrl` column in `Enrollment` schema, `paymentProofUrl` shown in admin enrollment card
- **What's missing:** Supabase Storage bucket, upload UI on class detail page, server-side validation that rejects enrollment without proof, signed URL generation for admin viewing
- **Impact:** Students can enroll without paying. This is the most critical business logic gap.

### Daily.co Token-Based Join
- **What exists:** `DailyRoom` component embeds an iframe using the public room URL
- **What's missing:** `POST /api/classes/[id]/join` route that calls Daily.co API to issue a meeting token with user's name and role bound to it; client receives token, not raw URL; `DAILY_API_KEY` never sent to client
- **Impact:** Anyone with the room URL can join without being an approved enrolled student. API key is not exposed (it's not in the iframe URL), but access control is absent.

### 15-Minute Pre-Join Window
- **What exists:** Join button shown when `status === LIVE_NOW`
- **What's missing:** Time-based gate: join only allowed from 15 min before `scheduleTime` until session ends
- **Impact:** Students can "join" a class that ran last week if status was never set to ENDED.

### Recording State Persistence
- **What exists:** Recording start/stop state in React `useState` on instructor dashboard
- **What's missing:** State is lost on page reload; `recordingId` stored in DB but dashboard doesn't re-fetch it on mount to restore UI state
- **Impact:** Instructor loses track of active recording after navigating away.

### Profile Page
- **What exists:** Page renders with hardcoded placeholder data ("Muhammad Ali")
- **What's missing:** Fetch from `/api/auth/me`, editable form, PATCH endpoint to update name/phone/city/avatarUrl
- **Impact:** Profile page is non-functional for all users.

### Attendance Marking
- **What exists:** `Attendance` table in schema, `markedAt` field
- **What's missing:** UI on instructor dashboard to mark which enrolled students attended after a LIVE session ends; no API route for attendance
- **Impact:** Attendance table is empty; student dashboard shows no history.

### Student Replay Access
- **What exists:** `videoUrl` field on `Class`, `type: RECORDED` enum value
- **What's missing:** UI to display embedded video on class detail page when `type === RECORDED` and enrollment is `APPROVED`; instructor upload flow for recorded video
- **Impact:** RECORDED class type is dead — no way to upload or view video.

---

## Missing Entirely

### Supabase RLS Policies
No row-level security policies exist on any table. Any user with the Supabase anon key can read/write all rows directly via the JS client. Currently mitigated by using Prisma exclusively, but a single client-side Supabase query would expose all data.

### Email Reminder Cron
1-hour-before-class reminder email to approved students is designed (email template exists: `sendSessionStartingEmail`) but no cron job triggers it. Requires Vercel Cron + a new API route.

### Pakistani Phone Validation
Registration accepts any string in the phone field. `+92` and `03xx-xxxxxxx` format validation is missing on both client and server.

### Supabase Auth Migration
`src/lib/client.ts`, `src/lib/server.ts`, and `src/lib/middleware.ts` were scaffolded for Supabase Auth but are not connected to anything. The custom JWT system (`auth.ts` + `get-session.ts`) is the only active auth layer.

### Test Suite
Zero tests exist. No Vitest, no React Testing Library, no Playwright. `package.json` has no test script.

### `/api/classes/[id]/join` Endpoint
No token-issuing endpoint exists. The current join flow gives students the room name, which their browser appends to the public Daily.co domain URL.
