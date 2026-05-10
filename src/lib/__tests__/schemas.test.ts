import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema, EnrollSchema, AttendanceSchema } from '../schemas';

describe('RegisterSchema', () => {
  const valid = {
    name: 'Ahmed Khan',
    email: 'ahmed@example.com',
    phone: '0312 1234567',
    city: 'Karachi',
    password: 'Str0ngPass!',
    role: 'STUDENT',
  };

  it('accepts a valid registration', () => {
    const result = RegisterSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('strips spaces/hyphens from phone', () => {
    const result = RegisterSchema.safeParse(valid);
    expect(result.success && result.data.phone).toBe('03121234567');
  });

  it('rejects a non-Pakistani phone', () => {
    const result = RegisterSchema.safeParse({ ...valid, phone: '1234567890' });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = RegisterSchema.safeParse({ ...valid, password: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = RegisterSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('accepts +92 format phone', () => {
    const result = RegisterSchema.safeParse({ ...valid, phone: '+923121234567' });
    expect(result.success).toBe(true);
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: 'pass' }).success).toBe(true);
  });

  it('rejects missing password', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('EnrollSchema', () => {
  it('requires paymentProofUrl', () => {
    expect(EnrollSchema.safeParse({}).success).toBe(false);
    expect(EnrollSchema.safeParse({ paymentProofUrl: 'user/class/123.jpg' }).success).toBe(true);
  });
});

describe('AttendanceSchema', () => {
  it('accepts valid records array', () => {
    const result = AttendanceSchema.safeParse({
      records: [{ enrollmentId: '550e8400-e29b-41d4-a716-446655440000', attended: true }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID enrollmentId', () => {
    const result = AttendanceSchema.safeParse({
      records: [{ enrollmentId: 'not-a-uuid', attended: true }],
    });
    expect(result.success).toBe(false);
  });
});
