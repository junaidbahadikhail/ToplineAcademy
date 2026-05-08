import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { role, isVerified, isActive } = body;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(role !== undefined && { role }),
      ...(isVerified !== undefined && { isVerified }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, name: true, email: true, role: true, isVerified: true, isActive: true },
  });

  return NextResponse.json(user);
}
