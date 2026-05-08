const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0);
  return d;
}

async function main() {
  const iHash = await bcrypt.hash('Instructor@1234', 10);
  const sHash = await bcrypt.hash('Student@1234', 10);

  const sana = await prisma.user.upsert({
    where: { email: 'sana@toplineacademy.com' },
    update: { role: 'INSTRUCTOR', isVerified: true },
    create: { name: 'Sana Ali', email: 'sana@toplineacademy.com', phone: '0312-1111111', city: 'Lahore', passwordHash: iHash, role: 'INSTRUCTOR', isVerified: true, isActive: true },
  });

  const ahmed = await prisma.user.upsert({
    where: { email: 'ahmed@toplineacademy.com' },
    update: { role: 'INSTRUCTOR', isVerified: true },
    create: { name: 'Ahmed Raza', email: 'ahmed@toplineacademy.com', phone: '0312-2222222', city: 'Karachi', passwordHash: iHash, role: 'INSTRUCTOR', isVerified: true, isActive: true },
  });

  const ali = await prisma.user.upsert({
    where: { email: 'student@toplineacademy.com' },
    update: {},
    create: { name: 'Ali Khan', email: 'student@toplineacademy.com', phone: '0333-3333333', city: 'Islamabad', passwordHash: sHash, role: 'STUDENT', isVerified: true, isActive: true },
  });

  const zara = await prisma.user.upsert({
    where: { email: 'zara@toplineacademy.com' },
    update: {},
    create: { name: 'Zara Malik', email: 'zara@toplineacademy.com', phone: '0333-4444444', city: 'Lahore', passwordHash: sHash, role: 'STUDENT', isVerified: true, isActive: true },
  });

  // Classes
  const c1 = await prisma.class.upsert({
    where: { id: 'seed-class-ai' },
    update: { scheduleTime: daysFromNow(2) },
    create: {
      id: 'seed-class-ai',
      title: 'AI Fundamentals for Beginners',
      subject: 'Artificial Intelligence',
      description: 'Learn the basics of AI and machine learning. Covers neural networks, Python basics, and hands-on projects suited for Pakistani internet conditions.',
      instructorId: sana.id,
      type: 'LIVE',
      scheduleTime: daysFromNow(2),
      maxStudents: 30,
      feePkr: 2500,
      status: 'UPCOMING',
      meetLink: 'toplineacademy-ai',
    },
  });

  const c2 = await prisma.class.upsert({
    where: { id: 'seed-class-python' },
    update: { scheduleTime: daysFromNow(5) },
    create: {
      id: 'seed-class-python',
      title: 'Python for Data Science',
      subject: 'Data Science',
      description: 'Hands-on Python covering pandas, matplotlib, and real-world datasets. PKT-friendly evening schedule.',
      instructorId: ahmed.id,
      type: 'LIVE',
      scheduleTime: daysFromNow(5),
      maxStudents: 25,
      feePkr: 3000,
      status: 'UPCOMING',
      meetLink: 'toplineacademy-python',
    },
  });

  const c3 = await prisma.class.upsert({
    where: { id: 'seed-class-web' },
    update: { scheduleTime: daysFromNow(7) },
    create: {
      id: 'seed-class-web',
      title: 'Full-Stack Web Development',
      subject: 'Web Development',
      description: 'Build real projects with React, Next.js, and Node.js. Includes deployment to Vercel with CI/CD.',
      instructorId: sana.id,
      type: 'LIVE',
      scheduleTime: daysFromNow(7),
      maxStudents: 20,
      feePkr: 3500,
      status: 'UPCOMING',
      meetLink: 'toplineacademy-web',
    },
  });

  const c4 = await prisma.class.upsert({
    where: { id: 'seed-class-nlp' },
    update: { scheduleTime: daysFromNow(10) },
    create: {
      id: 'seed-class-nlp',
      title: 'Natural Language Processing',
      subject: 'NLP & Deep Learning',
      description: 'Transformers, BERT, and fine-tuning LLMs for Urdu and English text. Includes practical Colab notebooks.',
      instructorId: ahmed.id,
      type: 'LIVE',
      scheduleTime: daysFromNow(10),
      maxStudents: 20,
      feePkr: 4000,
      status: 'UPCOMING',
      meetLink: 'toplineacademy-nlp',
    },
  });

  // Enrollments — delete old ones first to avoid duplicates
  await prisma.enrollment.deleteMany({ where: { studentId: ali.id } });
  await prisma.enrollment.deleteMany({ where: { studentId: zara.id } });

  await prisma.enrollment.createMany({
    data: [
      { studentId: ali.id, classId: c1.id, status: 'APPROVED', approvedAt: new Date() },
      { studentId: ali.id, classId: c2.id, status: 'PENDING' },
      { studentId: ali.id, classId: c3.id, status: 'APPROVED', approvedAt: new Date() },
      { studentId: zara.id, classId: c1.id, status: 'APPROVED', approvedAt: new Date() },
      { studentId: zara.id, classId: c4.id, status: 'PENDING' },
    ],
  });

  console.log('\n✅ Seed complete!\n');
  console.log('  Instructor 1:  sana@toplineacademy.com   / Instructor@1234');
  console.log('  Instructor 2:  ahmed@toplineacademy.com  / Instructor@1234');
  console.log('  Student 1:     student@toplineacademy.com / Student@1234');
  console.log('  Student 2:     zara@toplineacademy.com    / Student@1234\n');
}

main()
  .catch((err) => { console.error('❌ Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
