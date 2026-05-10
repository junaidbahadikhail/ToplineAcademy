import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import type { AuthTokenPayload } from '@/lib/auth';

export function getSession(): AuthTokenPayload | null {
  const token = cookies().get('topline_session')?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
