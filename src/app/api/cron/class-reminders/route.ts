import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSessionStartingEmail } from '@/lib/email';

// Vercel Cron invokes via GET. Finds classes starting in ~1 hour and emails approved students only.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

  // Query APPROVED enrollments whose class starts in the 55–65 min window
  const { data: enrollments } = await supabaseAdmin
    .from('Enrollment')
    .select('student:User!studentId(name, email), class:Class!classId(id, title, meetLink, scheduleTime, status)')
    .eq('status', 'APPROVED')
    .gte('class.scheduleTime', windowStart)
    .lte('class.scheduleTime', windowEnd)
    .eq('class.status', 'UPCOMING');

  let sent = 0;
  const classIds = new Set<string>();

  for (const enrollment of enrollments ?? []) {
    const student = enrollment.student as unknown as { name: string; email: string } | null;
    const cls = enrollment.class as unknown as { id: string; title: string; meetLink: string | null; status: string } | null;
    if (!student || !cls) continue;

    void sendSessionStartingEmail(student.email, student.name, cls.title, cls.meetLink ?? '');
    sent++;
    classIds.add(cls.id);
  }

  return NextResponse.json({
    ok: true,
    classesChecked: classIds.size,
    remindersSent: sent,
    window: { from: windowStart, to: windowEnd },
  });
}
