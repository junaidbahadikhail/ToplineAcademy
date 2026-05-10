import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';

export async function GET(request: Request) {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'ALL' | 'PENDING' | 'APPROVED' | null;

  const classes = await prisma.class.findMany({
    where:
      status === 'PENDING'
        ? { isApproved: false }
        : status === 'APPROVED'
        ? { isApproved: true }
        : {},
    include: {
      instructor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { scheduleTime: 'asc' },
  });

  return NextResponse.json(
    classes.map((cls) => ({
      id: cls.id,
      title: cls.title,
      subject: cls.subject,
      description: cls.description,
      scheduleTime: cls.scheduleTime.toISOString(),
      feePkr: cls.feePkr,
      maxStudents: cls.maxStudents,
      status: cls.status,
      isApproved: cls.isApproved,
      instructor: { id: cls.instructor.id, name: cls.instructor.name, email: cls.instructor.email },
    }))
  );
}
