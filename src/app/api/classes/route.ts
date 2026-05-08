import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSessionFromRequest } from '@/lib/get-session';
import { demoClasses, getDemoClassStatus } from '@/lib/demo-classes';

type ClassWithInstructor = Prisma.ClassGetPayload<{
  include: {
    instructor: {
      select: {
        name: true;
      };
    };
  };
}>;

const fallbackClasses = demoClasses.map((item) => ({
  id: item.id,
  title: item.title,
  instructor: item.instructor,
  schedule: item.scheduleTime,
  feePkr: item.feePkr,
  type: item.type,
  status: getDemoClassStatus(item.scheduleTime),
}));

export async function GET() {
  try {
    const classes = await prisma['class'].findMany({
      include: {
        instructor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduleTime: 'asc',
      },
    }) as ClassWithInstructor[];

    if (classes.length === 0) {
      return NextResponse.json(fallbackClasses);
    }

    const payload = classes.map((item) => ({
      id: item.id,
      title: item.title,
      instructor: { name: item.instructor.name },
      schedule: item.scheduleTime.toISOString(),
      feePkr: item.feePkr,
      type: item.type,
      status: item.status,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(fallbackClasses);
  }
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Only instructors can create classes.' }, { status: 403 });
  }

  const body = await request.json();
  const { title, subject, description, scheduleTime, maxStudents, feePkr } = body;

  if (!title || !subject || !scheduleTime || !maxStudents || !feePkr) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const cls = await prisma.class.create({
    data: {
      title,
      subject,
      description: description || '',
      instructorId: session.userId,
      type: 'LIVE',
      scheduleTime: new Date(scheduleTime),
      maxStudents: Number(maxStudents),
      feePkr: Number(feePkr),
      meetLink: `tl-${Date.now().toString(36)}`,
    },
  });

  return NextResponse.json(cls, { status: 201 });
}
