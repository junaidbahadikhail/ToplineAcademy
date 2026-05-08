import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [totalStudents, totalInstructors, pendingEnrollments, totalClasses] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
    prisma.enrollment.count({ where: { status: 'PENDING' } }),
    prisma.class.count(),
  ]);

  return NextResponse.json({ totalStudents, totalInstructors, pendingEnrollments, totalClasses });
}
