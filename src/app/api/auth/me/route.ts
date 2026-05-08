import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/get-session';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
