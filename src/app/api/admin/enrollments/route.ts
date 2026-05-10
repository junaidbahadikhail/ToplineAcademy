import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';
import { EnrollmentStatus } from '@prisma/client';

export async function GET(request: Request) {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as EnrollmentStatus | 'ALL' | null;

  const enrollments = await prisma.enrollment.findMany({
    where: status && status !== 'ALL' ? { status } : {},
    include: {
      student: { select: { id: true, name: true, email: true, phone: true } },
      class: { select: { id: true, title: true, subject: true, feePkr: true, scheduleTime: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(enrollments);
}
