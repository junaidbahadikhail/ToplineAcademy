import { Client } from '@notionhq/client';

const notion = process.env.NOTION_API_KEY
  ? new Client({ auth: process.env.NOTION_API_KEY })
  : null;

function isReady() {
  return !!notion && !!process.env.NOTION_ENROLLMENTS_DB && !!process.env.NOTION_CLASSES_DB;
}

export async function syncEnrollmentToNotion(data: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  className: string;
  subject: string;
  feePkr: number;
  scheduleTime: string;
  status: string;
  enrollmentId: string;
}) {
  if (!isReady()) return;
  try {
    await notion!.pages.create({
      parent: { database_id: process.env.NOTION_ENROLLMENTS_DB! },
      properties: {
        Name: { title: [{ text: { content: data.studentName } }] },
        Email: { email: data.studentEmail },
        Phone: { phone_number: data.studentPhone },
        Class: { select: { name: data.className } },
        Subject: { select: { name: data.subject } },
        'Fee (PKR)': { number: data.feePkr },
        'Schedule': {
          date: { start: new Date(data.scheduleTime).toISOString().split('T')[0] },
        },
        Status: { select: { name: data.status } },
        'Enrollment ID': { rich_text: [{ text: { content: data.enrollmentId } }] },
        'Applied On': { date: { start: new Date().toISOString().split('T')[0] } },
      },
    });
  } catch (err) {
    console.error('[notion] syncEnrollment failed:', err);
  }
}

export async function updateEnrollmentStatusInNotion(enrollmentId: string, status: string) {
  if (!isReady()) return;
  try {
    const res = await notion!.databases.query({
      database_id: process.env.NOTION_ENROLLMENTS_DB!,
      filter: {
        property: 'Enrollment ID',
        rich_text: { equals: enrollmentId },
      },
    });
    if (res.results.length === 0) return;
    await notion!.pages.update({
      page_id: res.results[0].id,
      properties: {
        Status: { select: { name: status } },
      },
    });
  } catch (err) {
    console.error('[notion] updateEnrollmentStatus failed:', err);
  }
}

export async function syncClassToNotion(data: {
  classId: string;
  title: string;
  subject: string;
  instructorName: string;
  instructorEmail: string;
  scheduleTime: string;
  feePkr: number;
  maxStudents: number;
  status: string;
}) {
  if (!isReady()) return;
  try {
    await notion!.pages.create({
      parent: { database_id: process.env.NOTION_CLASSES_DB! },
      properties: {
        Title: { title: [{ text: { content: data.title } }] },
        Subject: { select: { name: data.subject } },
        Instructor: { rich_text: [{ text: { content: data.instructorName } }] },
        'Instructor Email': { email: data.instructorEmail },
        'Schedule': {
          date: { start: new Date(data.scheduleTime).toISOString().split('T')[0] },
        },
        'Fee (PKR)': { number: data.feePkr },
        'Max Students': { number: data.maxStudents },
        Status: { select: { name: data.status } },
        'Class ID': { rich_text: [{ text: { content: data.classId } }] },
      },
    });
  } catch (err) {
    console.error('[notion] syncClass failed:', err);
  }
}

export async function updateClassStatusInNotion(classId: string, status: string) {
  if (!isReady()) return;
  try {
    const res = await notion!.databases.query({
      database_id: process.env.NOTION_CLASSES_DB!,
      filter: {
        property: 'Class ID',
        rich_text: { equals: classId },
      },
    });
    if (res.results.length === 0) return;
    await notion!.pages.update({
      page_id: res.results[0].id,
      properties: {
        Status: { select: { name: status } },
      },
    });
  } catch (err) {
    console.error('[notion] updateClassStatus failed:', err);
  }
}
