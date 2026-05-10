import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/get-session';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';
import { syncEnrollmentToNotion } from '@/lib/notion';
import { getDemoClassById } from '@/lib/demo-classes';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can enroll.' }, { status: 403 });

  if (getDemoClassById(params.id)) {
    return NextResponse.json(
      { error: 'demo', message: 'This is a demo class. To enroll in real classes, please register on Topline Academy.' },
      { status: 400 }
    );
  }

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
    data: { studentId: session.userId, classId: params.id },
  });

  // Fire-and-forget: email + Notion sync
  void sendEnrollmentConfirmationEmail(
    student.email,
    student.name,
    classItem.title,
    classItem.subject,
    classItem.scheduleTime.toISOString(),
  );
  void syncEnrollmentToNotion({
    studentName: student.name,
    studentEmail: student.email,
    studentPhone: student.phone,
    className: classItem.title,
    subject: classItem.subject,
    feePkr: classItem.feePkr,
    scheduleTime: classItem.scheduleTime.toISOString(),
    status: 'Pending Approval',
    enrollmentId: enrollment.id,
  });

  return NextResponse.json(enrollment, { status: 201 });
}
