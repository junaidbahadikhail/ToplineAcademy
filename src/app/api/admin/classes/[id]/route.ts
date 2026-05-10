import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';
interface ClassParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: ClassParams) {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { isApproved } = body as { isApproved?: boolean };
  if (typeof isApproved !== 'boolean') {
    return NextResponse.json({ error: 'Missing approval flag.' }, { status: 400 });
  }

  const classItem = await prisma.class.findUnique({ where: { id: params.id } });
  if (!classItem) {
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  }

  const updated = await prisma.class.update({
    where: { id: params.id },
    data: { isApproved },
  });

  return NextResponse.json({
    id: updated.id,
    isApproved: updated.isApproved,
  });
}
