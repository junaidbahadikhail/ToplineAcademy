import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/get-session';
import { getDemoClassById, getDemoClassStatus } from '@/lib/demo-classes';

interface ClassParams {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: ClassParams) {
  const classItem = await prisma['class'].findUnique({
    where: { id: params.id },
    include: {
      instructor: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!classItem) {
    const demoClass = getDemoClassById(params.id);
    if (demoClass) {
      return NextResponse.json({
        id: demoClass.id,
        title: demoClass.title,
        subject: demoClass.subject,
        description: demoClass.description,
        instructor: { name: demoClass.instructor.name },
        scheduleTime: demoClass.scheduleTime,
        timezone: demoClass.timezone || 'Asia/Karachi',
        meetLink: demoClass.meetLink,
        feePkr: demoClass.feePkr,
        type: demoClass.type,
        status: getDemoClassStatus(demoClass.scheduleTime),
        maxStudents: demoClass.maxStudents,
      });
    }
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: classItem.id,
    title: classItem.title,
    subject: classItem.subject,
    description: classItem.description,
    instructor: { name: classItem.instructor.name },
    scheduleTime: classItem.scheduleTime.toISOString(),
    timezone: classItem.timezone,
    meetLink: classItem.meetLink,
    videoUrl: classItem.videoUrl,
    feePkr: classItem.feePkr,
    type: classItem.type,
    status: classItem.status,
    maxStudents: classItem.maxStudents,
  });
}

export async function PATCH(request: Request, { params }: ClassParams) {
  const session = getSessionFromRequest(request);
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { scheduleTime, title, subject, description, maxStudents, feePkr } = body;

  const classItem = await prisma.class.findUnique({ where: { id: params.id } });
  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.instructorId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not your class.' }, { status: 403 });
  }

  const updated = await prisma.class.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(subject && { subject }),
      ...(description !== undefined && { description }),
      ...(scheduleTime && { scheduleTime: new Date(scheduleTime) }),
      ...(maxStudents && { maxStudents: Number(maxStudents) }),
      ...(feePkr && { feePkr: Number(feePkr) }),
    },
  });

  return NextResponse.json(updated);
}
