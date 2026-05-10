import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

export async function GET() {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: classes } = await supabaseAdmin
    .from('Class')
    .select('*, Enrollment(id, status), MeetingNote(summary, keyTopics, recordingId)')
    .eq('instructorId', session.userId)
    .order('scheduleTime', { ascending: true });

  const result = (classes ?? []).map((cls) => {
    const allEnrollments = (cls.Enrollment as { id: string; status: string }[] | null) ?? [];
    const approvedEnrollments = allEnrollments.filter((e) => e.status === 'APPROVED');
    return {
      ...cls,
      _count: { enrollments: allEnrollments.length },
      enrollments: approvedEnrollments,
      meetingNote: cls.MeetingNote ?? null,
      Enrollment: undefined,
      MeetingNote: undefined,
    };
  });

  return NextResponse.json(result);
}
