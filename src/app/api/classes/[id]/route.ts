import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { getDemoClassById, getDemoClassStatus } from '@/lib/demo-classes';

interface ClassParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: ClassParams) {
  const { data: classItem } = await supabaseAdmin
    .from('Class')
    .select('*, instructor:User!instructorId(name)')
    .eq('id', params.id)
    .single();

  if (!classItem) {
    const demoClass = getDemoClassById(params.id);
    if (demoClass) {
      return NextResponse.json({
        id: demoClass.id,
        title: demoClass.title,
        subject: demoClass.subject,
        description: demoClass.description,
        instructor: { name: demoClass.instructor.name },
        scheduleTime: demoClass.scheduleTime,
        timezone: demoClass.timezone || 'Asia/Karachi',
        meetLink: demoClass.meetLink,
        feePkr: demoClass.feePkr,
        type: demoClass.type,
        status: getDemoClassStatus(demoClass.scheduleTime),
        maxStudents: demoClass.maxStudents,
        isDemo: true,
      });
    }
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  }

  if (!classItem.isApproved) {
    const session = getSession();
    if (!session || (session.role !== 'ADMIN' && classItem.instructorId !== session.userId)) {
      return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
    }
  }

  return NextResponse.json({
    id: classItem.id,
    title: classItem.title,
    subject: classItem.subject,
    description: classItem.description,
    instructor: { name: (classItem.instructor as { name: string } | null)?.name ?? 'Unknown' },
    scheduleTime: classItem.scheduleTime,
    timezone: classItem.timezone,
    meetLink: classItem.meetLink,
    videoUrl: classItem.videoUrl,
    feePkr: classItem.feePkr,
    type: classItem.type,
    status: classItem.status,
    maxStudents: classItem.maxStudents,
    isApproved: classItem.isApproved,
  });
}

export async function PATCH(request: Request, { params }: ClassParams) {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { scheduleTime, title, subject, description, maxStudents, feePkr, videoUrl } = body;

  const { data: classItem } = await supabaseAdmin
    .from('Class')
    .select('id, instructorId')
    .eq('id', params.id)
    .single();

  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.instructorId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not your class.' }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (title) updateData.title = title;
  if (subject) updateData.subject = subject;
  if (description !== undefined) updateData.description = description;
  if (scheduleTime) updateData.scheduleTime = new Date(scheduleTime).toISOString();
  if (maxStudents) updateData.maxStudents = Number(maxStudents);
  if (feePkr) updateData.feePkr = Number(feePkr);
  if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;

  const { data: updated, error } = await supabaseAdmin
    .from('Class')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Class update error:', error);
    return NextResponse.json({ error: 'Failed to update class.' }, { status: 500 });
  }

  return NextResponse.json(updated);
}
