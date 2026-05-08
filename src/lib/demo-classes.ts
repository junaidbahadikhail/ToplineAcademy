export interface DemoClass {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  instructor: { name: string };
  scheduleTime: string;
  timezone?: string;
  meetLink?: string | null;
  feePkr: number;
  type: 'LIVE' | 'RECORDED';
  status: 'UPCOMING' | 'LIVE_NOW' | 'ENDED' | 'CANCELLED';
  maxStudents: number;
}

function getTodayPkTimeIso(hour: number, minute: number) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const utcHour = hour - 5;

  return new Date(Date.UTC(year, month - 1, day, utcHour, minute, 0, 0)).toISOString();
}

export const demoClasses: DemoClass[] = [
  {
    id: 'demo-today-8pm',
    title: 'Live AI Classroom at 8pm',
    subject: 'AI Foundations',
    description: 'Join our free live demo session today at 8pm PKT and learn AI class building, chatbots, and student workflows.',
    instructor: { name: 'Mrs. Sana Ali' },
    scheduleTime: getTodayPkTimeIso(20, 0),
    timezone: 'Asia/Karachi',
    meetLink: 'topline-demo-8pm',
    feePkr: 1500,
    type: 'LIVE',
    status: 'UPCOMING',
    maxStudents: 30,
  },
  {
    id: 'demo-python-data',
    title: 'Python Data Analytics',
    subject: 'Python for Data Science',
    description: 'Learn Python, data workflows, and visualization best practices in a practical session.',
    instructor: { name: 'Mr. Ahmed Raza' },
    scheduleTime: getTodayPkTimeIso(20, 0),
    timezone: 'Asia/Karachi',
    meetLink: null,
    feePkr: 1200,
    type: 'RECORDED',
    status: 'UPCOMING',
    maxStudents: 40,
  },
];

export function getDemoClassById(id: string) {
  return demoClasses.find((demoClass) => demoClass.id === id) ?? null;
}

export function getDemoClassStatus(scheduleTime: string) {
  const now = new Date();
  const scheduled = new Date(scheduleTime);
  const windowEnd = new Date(scheduled.getTime() + 90 * 60 * 1000);

  if (now >= scheduled && now < windowEnd) {
    return 'LIVE_NOW' as const;
  }

  if (now < scheduled) {
    return 'UPCOMING' as const;
  }

  return 'ENDED' as const;
}
