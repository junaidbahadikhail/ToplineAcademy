import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { action } = await request.json();

  const classItem = await prisma.class.findUnique({ where: { id: params.id } });
  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.instructorId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not your class.' }, { status: 403 });
  }

  const status = action === 'start' ? 'LIVE_NOW' : 'ENDED';
  const updated = await prisma.class.update({ where: { id: params.id }, data: { status } });

  return NextResponse.json(updated);
}
