import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { status } = body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Status must be APPROVED or REJECTED.' }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.update({
    where: { id: params.id },
    data: {
      status,
      ...(status === 'APPROVED' && { approvedAt: new Date() }),
    },
  });

  return NextResponse.json(enrollment);
}
