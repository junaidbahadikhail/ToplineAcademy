import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';
import { sendEnrollmentApprovedEmail, sendEnrollmentRejectedEmail } from '@/lib/email';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
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
    include: {
      student: { select: { name: true, email: true } },
      class: { select: { title: true, scheduleTime: true, meetLink: true } },
    },
  });

  // Fire-and-forget: email + Notion
  if (status === 'APPROVED') {
    void sendEnrollmentApprovedEmail(
      enrollment.student.email,
      enrollment.student.name,
      enrollment.class.title,
      enrollment.class.scheduleTime.toISOString(),
      enrollment.class.meetLink,
    );
  } else {
    void sendEnrollmentRejectedEmail(
      enrollment.student.email,
      enrollment.student.name,
      enrollment.class.title,
    );
  }
  return NextResponse.json(enrollment);
}
