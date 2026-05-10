import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
