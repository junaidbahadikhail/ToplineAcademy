import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { createOrGetDailyRoom, hasDailyDomain, getDailyRoomUrl, createDailyMeetingToken } from '@/lib/daily';

const PRE_JOIN_MS = 15 * 60 * 1000;
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  // Instructors and admins can join at any time (they started the session)
  if (!isOwner) {
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
  }

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('name, email')
    .eq('id', session.userId)
    .single();

  const baseRoomName = cls.meetLink ?? 'toplineacademy-session';
  const userName = user?.name ?? session.email;
  const userEmail = user?.email ?? session.email;

  // Daily.co — always active when NEXT_PUBLIC_DAILY_DOMAIN is set
  if (hasDailyDomain()) {
    const roomUrl = await createOrGetDailyRoom(baseRoomName) ?? getDailyRoomUrl(baseRoomName);
    // Issue a meeting token so the user joins authenticated without a knock/auth screen
    const token = await createDailyMeetingToken(baseRoomName, userName, isOwner);
    return NextResponse.json({ roomUrl, token, roomName: baseRoomName, domain: 'daily', userName });
  }

  // Jitsi fallback — only reached when Daily.co domain is not configured
  const { getJitsiRoomConfig } = await import('@/lib/jitsi');
  const roomConfig = getJitsiRoomConfig(baseRoomName, session.userId, userName, userEmail, isOwner);
  return NextResponse.json({
    roomUrl: null,
    token: null,
    roomName: roomConfig.roomName,
    domain: roomConfig.domain,
    jwt: roomConfig.jwt ?? null,
    userName,
  });
}
