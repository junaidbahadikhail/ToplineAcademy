import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') as UserRole | null;

  const users = await prisma.user.findMany({
    where: role ? { role } : { role: { in: ['STUDENT', 'INSTRUCTOR'] } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      role: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}
