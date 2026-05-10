import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.userId },
    include: {
      class: {
        include: {
          instructor: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { class: { scheduleTime: 'asc' } },
  });

  return NextResponse.json(enrollments);
}
