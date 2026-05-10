import { z } from 'zod';

const pakistaniPhone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine(
    (v) => /^([+]92\d{10}|03\d{9})$/.test(v),
    { message: 'Phone must be a valid Pakistani number (e.g. 0312 1234567 or +923121234567).' }
  );

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().email('Invalid email address.'),
  phone: pakistaniPhone,
  city: z.string().min(2, 'City is required.').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(['STUDENT', 'INSTRUCTOR']).default('STUDENT'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: pakistaniPhone.optional(),
  city: z.string().min(2).max(100).optional(),
});

export const CreateClassSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').max(200),
  subject: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  scheduleTime: z.string().datetime({ message: 'scheduleTime must be a valid ISO datetime.' }),
  maxStudents: z.number().int().min(1).max(500),
  feePkr: z.number().int().min(0),
  type: z.enum(['LIVE', 'RECORDED']).default('LIVE'),
  videoUrl: z.string().url().optional().nullable(),
});

export const EnrollSchema = z.object({
  paymentProofUrl: z.string().min(1, 'Payment proof is required.'),
});

export const AttendanceSchema = z.object({
  records: z.array(
    z.object({
      enrollmentId: z.string().uuid(),
      attended: z.boolean(),
    })
  ),
});

export const EnrollmentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
