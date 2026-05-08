import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
