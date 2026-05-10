import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';

// GET: student fetches their own attendance history
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const records = await prisma.attendance.findMany({
    where: { enrollment: { studentId: session.userId } },
    include: {
      class: {
        select: { id: true, title: true, subject: true, scheduleTime: true },
      },
    },
    orderBy: { class: { scheduleTime: 'desc' } },
  });

  return NextResponse.json(records);
}
