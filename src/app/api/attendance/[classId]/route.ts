import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { AttendanceSchema } from '@/lib/schemas';

export async function GET(_request: Request, { params }: { params: { classId: string } }) {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: cls } = await supabaseAdmin
    .from('Class')
    .select('instructorId')
    .eq('id', params.classId)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (session.role === 'INSTRUCTOR' && cls.instructorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const { data: enrollments } = await supabaseAdmin
    .from('Enrollment')
    .select('*, student:User!studentId(id, name, email), Attendance(id, attended, markedAt)')
    .eq('classId', params.classId)
    .eq('status', 'APPROVED')
    .order('createdAt', { ascending: true });

  return NextResponse.json(enrollments ?? []);
}

export async function POST(request: Request, { params }: { params: { classId: string } }) {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: cls } = await supabaseAdmin
    .from('Class')
    .select('instructorId')
    .eq('id', params.classId)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (session.role === 'INSTRUCTOR' && cls.instructorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = AttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid attendance data.' }, { status: 400 });
  }
  const { records } = parsed.data;

  const now = new Date().toISOString();
  const upsertData = records.map((r) => ({
    enrollmentId: r.enrollmentId,
    classId: params.classId,
    attended: r.attended,
    markedAt: now,
  }));

  const { error } = await supabaseAdmin
    .from('Attendance')
    .upsert(upsertData, { onConflict: 'enrollmentId' });

  if (error) {
    console.error('Attendance upsert error:', error);
    return NextResponse.json({ error: 'Failed to save attendance.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}
