import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can enroll.' }, { status: 403 });

  const existing = await prisma.enrollment.findFirst({
    where: { studentId: session.userId, classId: params.id },
  });
  if (existing) return NextResponse.json({ error: 'Already enrolled.' }, { status: 409 });

  const classItem = await prisma.class.findUnique({ where: { id: params.id } });
  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.status === 'ENDED' || classItem.status === 'CANCELLED') {
    return NextResponse.json({ error: 'This class is no longer accepting enrollments.' }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId: session.userId, classId: params.id },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
