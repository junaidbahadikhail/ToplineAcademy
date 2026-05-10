import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';

// GET: instructor fetches enrolled students + their attendance status for a class
export async function GET(_request: Request, { params }: { params: { classId: string } }) {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cls = await prisma.class.findUnique({
    where: { id: params.classId },
    select: { instructorId: true },
  });

  if (!cls) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (session.role === 'INSTRUCTOR' && cls.instructorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: params.classId, status: 'APPROVED' },
    include: {
      student: { select: { id: true, name: true, email: true } },
      attendance: { select: { id: true, attended: true, markedAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(enrollments);
}

// POST: instructor saves attendance for all students in a class
export async function POST(request: Request, { params }: { params: { classId: string } }) {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cls = await prisma.class.findUnique({
    where: { id: params.classId },
    select: { instructorId: true },
  });

  if (!cls) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (session.role === 'INSTRUCTOR' && cls.instructorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { records } = body as { records?: { enrollmentId: string; attended: boolean }[] };

  if (!Array.isArray(records)) {
    return NextResponse.json({ error: 'records array is required.' }, { status: 400 });
  }

  const now = new Date();
  await Promise.all(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { enrollmentId: r.enrollmentId },
        create: {
          enrollmentId: r.enrollmentId,
          classId: params.classId,
          attended: r.attended,
          markedAt: now,
        },
        update: {
          attended: r.attended,
          markedAt: now,
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: records.length });
}
