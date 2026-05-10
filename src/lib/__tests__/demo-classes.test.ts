import { describe, it, expect } from 'vitest';
import { getDemoClassById, getDemoClassStatus, demoClasses } from '../demo-classes';

describe('getDemoClassById', () => {
  it('returns a demo class by known id', () => {
    const cls = getDemoClassById('demo-today-8pm');
    expect(cls).not.toBeNull();
    expect(cls?.title).toBeTruthy();
  });

  it('returns null for an unknown id', () => {
    expect(getDemoClassById('not-a-real-id')).toBeNull();
  });

  it('returns null for a real DB-style UUID', () => {
    expect(getDemoClassById('550e8400-e29b-41d4-a716-446655440000')).toBeNull();
  });
});

describe('getDemoClassStatus', () => {
  it('returns UPCOMING for a future schedule', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(getDemoClassStatus(future)).toBe('UPCOMING');
  });

  it('returns ENDED for a past schedule', () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(getDemoClassStatus(past)).toBe('ENDED');
  });

  it('returns LIVE_NOW for a schedule within the 90-minute window', () => {
    const recent = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(getDemoClassStatus(recent)).toBe('LIVE_NOW');
  });
});

describe('demoClasses', () => {
  it('has at least one class', () => {
    expect(demoClasses.length).toBeGreaterThan(0);
  });

  it('every demo class has required fields', () => {
    for (const cls of demoClasses) {
      expect(cls.id).toBeTruthy();
      expect(cls.title).toBeTruthy();
      expect(cls.feePkr).toBeGreaterThanOrEqual(0);
      expect(['LIVE', 'RECORDED']).toContain(cls.type);
    }
  });
});
