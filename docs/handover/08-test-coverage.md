# 08 — Test Coverage

---

## Current State

**Zero tests exist.**

- No `vitest.config.ts`
- No `playwright.config.ts`
- No `__tests__/` directories
- No `*.test.ts` or `*.spec.ts` files
- `package.json` has no `test` script

---

## What Must Be Tested (priority order)

### Unit Tests (Vitest)

| Module | Functions | Priority |
|---|---|---|
| `src/lib/auth.ts` | `hashPassword`, `verifyPassword`, `signToken`, `verifyToken` | P0 |
| `src/lib/demo-classes.ts` | `getDemoClassStatus` — boundary conditions at ±15min of scheduleTime | P1 |
| `src/lib/email.ts` | Template output — verify branded HTML contains correct fields | P2 |
| `src/lib/meeting-processor.ts` | `analyzeTranscript` mock — correct field mapping | P2 |

### Integration Tests (Vitest + test DB)

| Route | Scenarios | Priority |
|---|---|---|
| `POST /api/auth/register` | Valid student, valid instructor, duplicate email, missing fields | P0 |
| `POST /api/auth/login` | Valid credentials, wrong password, unknown email | P0 |
| `POST /api/classes/[id]/enroll` | Enrolled student, unauthenticated, already enrolled, ENDED class, demo class | P0 |
| `PATCH /api/admin/enrollments/[id]` | Admin approves, admin rejects, non-admin blocked | P1 |
| `GET /api/classes` | Returns approved only, demo fallback when empty | P1 |
| `GET /api/auth/me` | Valid session, expired token, no cookie | P1 |

### E2E Tests (Playwright)

| Flow | Steps | Priority |
|---|---|---|
| Full student journey | Register → Login → Browse classes → Enroll → Admin approves → Join live class | P0 |
| Instructor journey | Login → Create class → Start session → End session → Generate notes | P1 |
| Admin journey | Login → View pending enrollments → Approve → View pending classes → Approve | P1 |
| Auth guard | Access `/admin` without login → redirect to `/login` | P1 |
| Demo class CTA | Visit demo class → See "Demo class" panel → No enrollment form | P2 |

---

## Test Infrastructure Needed

```bash
# Install
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test

# vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
})

# package.json scripts to add
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"test:coverage": "vitest run --coverage"
```

---

## Regression Checklist (manual until tests exist)

Run after every PR:

- [ ] Register as student → login → see student dashboard
- [ ] Register as instructor → admin verifies → instructor can create class
- [ ] Create class (instructor) → admin approves → class appears on `/classes`
- [ ] Student enrolls → admin sees pending → approves → student sees approved status
- [ ] Instructor starts session → enrolled student sees "Join" button
- [ ] `GET /api/health` returns all services
- [ ] Login with wrong password → error shown, no cookie set
- [ ] Unauthenticated access to `/admin` → redirected (currently no redirect, just empty state — mark as gap)
