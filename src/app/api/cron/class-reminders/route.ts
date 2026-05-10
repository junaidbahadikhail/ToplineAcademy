import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSessionStartingEmail } from '@/lib/email';

// Vercel Cron invokes via GET. Finds classes starting in ~1 hour and emails approved students.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

  const { data: classes } = await supabaseAdmin
    .from('Class')
    .select('id, title, meetLink, Enrollment!classId(student:User!studentId(name, email))')
    .eq('status', 'UPCOMING')
    .gte('scheduleTime', windowStart)
    .lte('scheduleTime', windowEnd);

  let sent = 0;

  for (const cls of classes ?? []) {
    const enrollments = (cls.Enrollment as unknown as { student: { name: string; email: string } | null }[] | null) ?? [];
    for (const enrollment of enrollments) {
      if (!enrollment.student) continue;
      void sendSessionStartingEmail(
        enrollment.student.email,
        enrollment.student.name,
        cls.title,
        cls.meetLink ?? '',
      );
      sent++;
    }
  }

  return NextResponse.json({
    ok: true,
    classesChecked: (classes ?? []).length,
    remindersSent: sent,
    window: { from: windowStart, to: windowEnd },
  });
}
