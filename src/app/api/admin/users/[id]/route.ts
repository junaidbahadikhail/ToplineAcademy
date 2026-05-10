import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';
import { sendInstructorApprovedEmail } from '@/lib/email';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { role, isVerified, isActive } = body;

  const before = await prisma.user.findUnique({ where: { id: params.id } });

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(role !== undefined && { role }),
      ...(isVerified !== undefined && { isVerified }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, name: true, email: true, role: true, isVerified: true, isActive: true },
  });

  // Send instructor approval email when an instructor gets verified
  if (
    isVerified === true &&
    before &&
    !before.isVerified &&
    (before.role === 'INSTRUCTOR' || role === 'INSTRUCTOR')
  ) {
    void sendInstructorApprovedEmail(user.email, user.name);
  }

  return NextResponse.json(user);
}
