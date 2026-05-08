import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: { instructorId: session.userId },
    include: {
      _count: { select: { enrollments: true } },
      enrollments: { where: { status: 'APPROVED' }, select: { id: true } },
    },
    orderBy: { scheduleTime: 'asc' },
  });

  return NextResponse.json(classes);
}
