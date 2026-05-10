import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/get-session';
import { demoClasses, getDemoClassStatus } from '@/lib/demo-classes';
import { CreateClassSchema } from '@/lib/schemas';

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
    const classes = await prisma.class.findMany({
      where: { isApproved: true },
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
  } catch {
    return NextResponse.json(fallbackClasses);
  }
}

export async function POST(request: Request) {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Only instructors can create classes.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CreateClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { title, subject, description, scheduleTime, maxStudents, feePkr, type, videoUrl } = parsed.data;

  const cls = await prisma.class.create({
    data: {
      title,
      subject,
      description: description ?? '',
      instructorId: session.userId,
      type,
      scheduleTime: new Date(scheduleTime),
      maxStudents,
      feePkr,
      videoUrl: videoUrl ?? null,
      isApproved: session.role === 'ADMIN',
      meetLink: type === 'LIVE' ? `tl-${Date.now().toString(36)}` : null,
    },
  });

  return NextResponse.json(cls, { status: 201 });
}
