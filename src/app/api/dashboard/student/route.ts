import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: enrollments } = await supabaseAdmin
    .from('Enrollment')
    .select('*, class:Class!classId(*, instructor:User!instructorId(name))')
    .eq('studentId', session.userId);

  // Sort by class scheduleTime ascending
  const sorted = (enrollments ?? []).sort((a, b) => {
    const aTime = new Date((a.class as { scheduleTime: string } | null)?.scheduleTime ?? 0).getTime();
    const bTime = new Date((b.class as { scheduleTime: string } | null)?.scheduleTime ?? 0).getTime();
    return aTime - bTime;
  });

  return NextResponse.json(sorted);
}
