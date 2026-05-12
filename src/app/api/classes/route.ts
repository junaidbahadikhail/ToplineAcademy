import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { demoClasses, getDemoClassStatus } from '@/lib/demo-classes';
import { CreateClassSchema } from '@/lib/schemas';
import { createOrGetDailyRoom, hasDailyDomain } from '@/lib/daily';

const fallbackClasses = demoClasses.map((item) => ({
  id: item.id,
  title: item.title,
  subject: item.subject,
  instructor: item.instructor,
  schedule: item.scheduleTime,
  feePkr: item.feePkr,
  type: item.type,
  status: getDemoClassStatus(item.scheduleTime),
}));

export async function GET() {
  try {
    const { data: classes, error } = await supabaseAdmin
      .from('Class')
      .select('id, title, scheduleTime, feePkr, type, status, instructorId, instructor:User!instructorId(name)')
      .eq('isApproved', true)
      .order('scheduleTime', { ascending: true });

    if (error || !classes || classes.length === 0) {
      return NextResponse.json(fallbackClasses);
    }

    const payload = classes.map((item) => ({
      id: item.id,
      title: item.title,
      instructor: { name: (item.instructor as unknown as { name: string } | null)?.name ?? 'Unknown' },
      schedule: item.scheduleTime,
      feePkr: item.feePkr,
      type: item.type,
      status: item.status,
    }));

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(fallbackClasses);
  }
}

export async function POST(request: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only instructors can create classes.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CreateClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { title, subject, description, courseOutline, scheduleTime, maxStudents, feePkr, type, videoUrl, instructorId: bodyInstructorId } = parsed.data;

  const isAdmin = session.role === 'ADMIN';
  // Admins may assign any instructor; others always own the class themselves
  const instructorId = isAdmin && bodyInstructorId ? bodyInstructorId : session.userId;

  // Create the class row first (no meetLink yet for LIVE classes)
  const { data: cls, error } = await supabaseAdmin
    .from('Class')
    .insert({
      title,
      subject,
      description: description ?? '',
      courseOutline: courseOutline ?? null,
      instructorId,
      type,
      scheduleTime: new Date(scheduleTime).toISOString(),
      maxStudents,
      feePkr,
      videoUrl: videoUrl ?? null,
      isApproved: isAdmin,
      meetLink: null,
    })
    .select()
    .single();

  if (error || !cls) {
    console.error('Class create error:', error);
    return NextResponse.json({ error: 'Failed to create class.' }, { status: 500 });
  }

  // Admin-created LIVE classes: immediately provision a Daily.co room using the real class ID
  if (isAdmin && type === 'LIVE' && hasDailyDomain()) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    const roomName = `tl-${cls.id.slice(0, 8)}-${slug}`;
    const roomUrl = await createOrGetDailyRoom(roomName);
    if (roomUrl) {
      await supabaseAdmin.from('Class').update({ meetLink: roomName }).eq('id', cls.id);
      cls.meetLink = roomName;
    }
  }

  return NextResponse.json(cls, { status: 201 });
}
