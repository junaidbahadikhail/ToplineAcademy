import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';
import { getDemoClassById } from '@/lib/demo-classes';
import { EnrollSchema } from '@/lib/schemas';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can enroll.' }, { status: 403 });

  if (getDemoClassById(params.id)) {
    return NextResponse.json(
      { error: 'demo', message: 'This is a demo class. To enroll in real classes, please register on Topline Academy.' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = EnrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payment proof is required. Please upload a screenshot of your bank transfer.' },
      { status: 400 }
    );
  }
  const { paymentProofUrl } = parsed.data;

  const existing = await prisma.enrollment.findFirst({
    where: { studentId: session.userId, classId: params.id },
  });
  if (existing) return NextResponse.json({ error: 'Already enrolled.' }, { status: 409 });

  const classItem = await prisma.class.findUnique({
    where: { id: params.id },
    include: { instructor: { select: { name: true } } },
  });
  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.status === 'ENDED' || classItem.status === 'CANCELLED') {
    return NextResponse.json({ error: 'This class is no longer accepting enrollments.' }, { status: 400 });
  }

  const student = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!student) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const enrollment = await prisma.enrollment.create({
    data: { studentId: session.userId, classId: params.id, paymentProofUrl },
  });

  void sendEnrollmentConfirmationEmail(
    student.email,
    student.name,
    classItem.title,
    classItem.subject,
    classItem.scheduleTime.toISOString(),
  );

  return NextResponse.json(enrollment, { status: 201 });
}
