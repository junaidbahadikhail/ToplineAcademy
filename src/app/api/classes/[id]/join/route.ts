import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const PRE_JOIN_MS = 15 * 60 * 1000;
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!DAILY_API_KEY) {
    return NextResponse.json({ error: 'Video service not configured.' }, { status: 503 });
  }

  const { data: cls } = await supabaseAdmin
    .from('Class')
    .select('meetLink, scheduleTime, instructorId')
    .eq('id', params.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const isInstructor = session.role === 'INSTRUCTOR' && session.userId === cls.instructorId;
  const isAdmin = session.role === 'ADMIN';
  const isOwner = isInstructor || isAdmin;

  if (session.role === 'STUDENT') {
    const { data: enrollment } = await supabaseAdmin
      .from('Enrollment')
      .select('id')
      .eq('studentId', session.userId)
      .eq('classId', params.id)
      .eq('status', 'APPROVED')
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You need an approved enrollment to join this class.' },
        { status: 403 }
      );
    }
  } else if (!isOwner) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const now = Date.now();
  const start = new Date(cls.scheduleTime).getTime();
  const earliest = start - PRE_JOIN_MS;
  const latest = start + SESSION_DURATION_MS;

  if (now < earliest) {
    const minutes = Math.ceil((earliest - now) / 60000);
    return NextResponse.json(
      { error: `Session opens in ${minutes} minute${minutes === 1 ? '' : 's'}. Join up to 15 minutes before start.` },
      { status: 403 }
    );
  }

  if (now > latest) {
    return NextResponse.json({ error: 'This session has ended.' }, { status: 403 });
  }

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('name')
    .eq('id', session.userId)
    .single();

  const roomName = cls.meetLink ?? process.env.NEXT_PUBLIC_DAILY_ROOM ?? 'toplineacademy-session';
  const expiry = Math.floor(latest / 1000);

  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: user?.name ?? session.email,
        user_id: session.userId,
        is_owner: isOwner,
        exp: expiry,
      },
    }),
  });

  if (!tokenRes.ok) {
    console.error('[daily] token creation failed:', await tokenRes.text());
    return NextResponse.json({ error: 'Failed to create session token.' }, { status: 502 });
  }

  const { token } = await tokenRes.json() as { token: string };
  return NextResponse.json({ token, roomName });
}
