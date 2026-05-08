import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type ClassWithInstructor = Prisma.ClassGetPayload<{
  include: {
    instructor: {
      select: {
        name: true;
      };
    };
  };
}>;

const fallbackClasses = [
  {
    id: 'demo-1',
    title: 'AI Fundamentals for Beginners',
    instructor: { name: 'Mrs. Sana Ali' },
    schedule: 'May 15, 2026 · 18:00 PKT',
    feePkr: 2500,
    type: 'LIVE',
    status: 'UPCOMING',
  },
  {
    id: 'demo-2',
    title: 'Python for Data Science',
    instructor: { name: 'Mr. Ahmed Raza' },
    schedule: 'May 18, 2026 · 20:00 PKT',
    feePkr: 3000,
    type: 'LIVE',
    status: 'UPCOMING',
  },
];

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
