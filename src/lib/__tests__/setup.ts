// Set required env vars before any module-level code runs
process.env.JWT_SECRET = 'vitest-test-secret-at-least-32-characters-long!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
