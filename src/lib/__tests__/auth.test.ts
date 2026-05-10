import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../auth';

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('MyP@ssw0rd');
    expect(hash).not.toBe('MyP@ssw0rd');
    const match = await verifyPassword('MyP@ssw0rd', hash);
    expect(match).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct');
    const match = await verifyPassword('wrong', hash);
    expect(match).toBe(false);
  });
});

describe('signToken / verifyToken', () => {
  const payload = { userId: 'user-123', email: 'test@example.com', role: 'STUDENT' as const };

  it('round-trips a token', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('throws on a tampered token', () => {
    const token = signToken(payload);
    expect(() => verifyToken(token + 'tampered')).toThrow();
  });
});
