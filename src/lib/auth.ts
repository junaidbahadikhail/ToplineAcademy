import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set.');
const secret = process.env.JWT_SECRET as string;
const expiresIn = '7d';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string) {
  return jwt.verify(token, secret) as AuthTokenPayload;
}
