import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get student's enrollment IDs first
  const { data: enrollments } = await supabaseAdmin
    .from('Enrollment')
    .select('id')
    .eq('studentId', session.userId);

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json([]);
  }

  const enrollmentIds = enrollments.map((e) => e.id);

  const { data: records } = await supabaseAdmin
    .from('Attendance')
    .select('*, class:Class!classId(id, title, subject, scheduleTime)')
    .in('enrollmentId', enrollmentIds)
    .order('classId', { ascending: false });

  // Sort by class scheduleTime descending in memory
  const sorted = (records ?? []).sort((a, b) => {
    const aTime = new Date((a.class as { scheduleTime: string } | null)?.scheduleTime ?? 0).getTime();
    const bTime = new Date((b.class as { scheduleTime: string } | null)?.scheduleTime ?? 0).getTime();
    return bTime - aTime;
  });

  return NextResponse.json(sorted);
}
