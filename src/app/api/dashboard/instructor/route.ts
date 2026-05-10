import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';

export async function GET() {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: { instructorId: session.userId },
    include: {
      _count: { select: { enrollments: true } },
      enrollments: { where: { status: 'APPROVED' }, select: { id: true } },
      meetingNote: { select: { summary: true, keyTopics: true, recordingId: true } },
    },
    orderBy: { scheduleTime: 'asc' },
  });

  return NextResponse.json(classes);
}
