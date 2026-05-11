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

// Always 30 min in the past — stays LIVE_NOW for testing throughout the 2-hour window
function getLiveNowIso() {
  return new Date(Date.now() - 30 * 60 * 1000).toISOString();
}

function getFuturePkIso(daysAhead: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hour - 5, minute, 0, 0)).toISOString();
}

export const demoClasses: DemoClass[] = [
  {
    id: 'demo-live-now-test',
    title: 'Digital Marketing Masterclass',
    subject: 'Digital Marketing',
    description: 'Master SEO, social media ads, and content strategy in this live session. Use this to test the live video classroom experience.',
    instructor: { name: 'Ms. Fatima Malik' },
    scheduleTime: getLiveNowIso(),
    timezone: 'Asia/Karachi',
    meetLink: 'toplineacademy-session',
    feePkr: 2000,
    type: 'LIVE',
    status: 'UPCOMING',
    maxStudents: 35,
  },
  {
    id: 'demo-today-8pm',
    title: 'Live AI Classroom at 8pm',
    subject: 'AI Foundations',
    description: 'Join our free live demo session today at 8pm PKT and learn AI class building, chatbots, and student workflows.',
    instructor: { name: 'Mrs. Sana Ali' },
    scheduleTime: getTodayPkTimeIso(20, 0),
    timezone: 'Asia/Karachi',
    meetLink: 'toplineacademy-session',
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
  {
    id: 'demo-web-dev',
    title: 'Full Stack Web Development',
    subject: 'Web Development',
    description: 'Build real-world apps with React, Next.js, and Node.js. From zero to deployment in 8 weeks.',
    instructor: { name: 'Mr. Usman Tariq' },
    scheduleTime: getFuturePkIso(2, 18, 0),
    timezone: 'Asia/Karachi',
    meetLink: 'toplineacademy-webdev',
    feePkr: 2500,
    type: 'LIVE',
    status: 'UPCOMING',
    maxStudents: 25,
  },
  {
    id: 'demo-english-comm',
    title: 'English Communication Skills',
    subject: 'English Language',
    description: 'Improve your spoken and written English with practical exercises, presentations, and real-world conversation practice.',
    instructor: { name: 'Ms. Ayesha Khan' },
    scheduleTime: getFuturePkIso(3, 17, 0),
    timezone: 'Asia/Karachi',
    meetLink: 'toplineacademy-english',
    feePkr: 800,
    type: 'LIVE',
    status: 'UPCOMING',
    maxStudents: 20,
  },
  {
    id: 'demo-mathematics',
    title: 'O-Level Mathematics Complete',
    subject: 'Mathematics',
    description: 'Full O-Level Math course: algebra, geometry, statistics, and past paper practice for CIE and FBISE boards.',
    instructor: { name: 'Mr. Bilal Ahmad' },
    scheduleTime: getFuturePkIso(5, 15, 0),
    timezone: 'Asia/Karachi',
    meetLink: null,
    feePkr: 1500,
    type: 'RECORDED',
    status: 'UPCOMING',
    maxStudents: 60,
  },
  {
    id: 'demo-graphic-design',
    title: 'Graphic Design with Canva & Figma',
    subject: 'Graphic Design',
    description: 'Learn design fundamentals, brand identity, social media graphics, and UI mockups using Canva and Figma.',
    instructor: { name: 'Mrs. Nadia Hussain' },
    scheduleTime: getFuturePkIso(7, 19, 0),
    timezone: 'Asia/Karachi',
    meetLink: null,
    feePkr: 1000,
    type: 'RECORDED',
    status: 'UPCOMING',
    maxStudents: 50,
  },
  {
    id: 'demo-accounting',
    title: 'Accounting & Finance Basics',
    subject: 'Accounting',
    description: 'Understand double-entry bookkeeping, financial statements, and QuickBooks for small business finance management.',
    instructor: { name: 'Mr. Hassan Sheikh' },
    scheduleTime: getFuturePkIso(4, 16, 30),
    timezone: 'Asia/Karachi',
    meetLink: 'toplineacademy-accounting',
    feePkr: 1800,
    type: 'LIVE',
    status: 'UPCOMING',
    maxStudents: 30,
  },
  {
    id: 'demo-physics',
    title: 'A-Level Physics Revision',
    subject: 'Physics',
    description: 'Comprehensive A-Level Physics: mechanics, electricity, waves, and nuclear physics with MCQ practice.',
    instructor: { name: 'Mr. Zubair Iqbal' },
    scheduleTime: getFuturePkIso(6, 14, 0),
    timezone: 'Asia/Karachi',
    meetLink: null,
    feePkr: 1200,
    type: 'RECORDED',
    status: 'UPCOMING',
    maxStudents: 45,
  },
  {
    id: 'demo-urdu',
    title: 'Urdu Writing & Literature',
    subject: 'Urdu',
    description: 'Master Urdu grammar, poetry analysis, and essay writing for Matric and FSc boards.',
    instructor: { name: 'Mrs. Rabia Siddiqui' },
    scheduleTime: getFuturePkIso(1, 11, 0),
    timezone: 'Asia/Karachi',
    meetLink: 'toplineacademy-urdu',
    feePkr: 600,
    type: 'LIVE',
    status: 'UPCOMING',
    maxStudents: 35,
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
