import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
