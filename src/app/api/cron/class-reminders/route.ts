import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSessionStartingEmail } from '@/lib/email';

// Vercel Cron calls this every hour.
// Finds classes starting in the next 60 minutes and emails approved students.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);  // 55 min from now
  const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);    // 65 min from now

  const classes = await prisma.class.findMany({
    where: {
      status: 'UPCOMING',
      scheduleTime: { gte: windowStart, lte: windowEnd },
    },
    include: {
      enrollments: {
        where: { status: 'APPROVED' },
        include: {
          student: { select: { name: true, email: true } },
        },
      },
    },
  });

  let sent = 0;

  for (const cls of classes) {
    for (const enrollment of cls.enrollments) {
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
    classesChecked: classes.length,
    remindersSent: sent,
    window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
  });
}
