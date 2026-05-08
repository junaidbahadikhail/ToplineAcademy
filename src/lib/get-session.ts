import { verifyToken } from '@/lib/auth';
import type { AuthTokenPayload } from '@/lib/auth';

export function getSessionFromRequest(request: Request): AuthTokenPayload | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/topline_session=([^;]+)/);
  if (!match) return null;
  try {
    return verifyToken(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}
