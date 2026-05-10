import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';
import { getDemoClassById } from '@/lib/demo-classes';
import { EnrollSchema } from '@/lib/schemas';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can enroll.' }, { status: 403 });

  if (getDemoClassById(params.id)) {
    return NextResponse.json(
      { error: 'demo', message: 'This is a demo class. To enroll in real classes, please register on Topline Academy.' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = EnrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payment proof is required. Please upload a screenshot of your bank transfer.' },
      { status: 400 }
    );
  }
  const { paymentProofUrl } = parsed.data;

  const { data: existing } = await supabaseAdmin
    .from('Enrollment')
    .select('id')
    .eq('studentId', session.userId)
    .eq('classId', params.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Already enrolled.' }, { status: 409 });

  const { data: classItem } = await supabaseAdmin
    .from('Class')
    .select('id, title, subject, scheduleTime, status, instructor:User!instructorId(name)')
    .eq('id', params.id)
    .single();

  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.status === 'ENDED' || classItem.status === 'CANCELLED') {
    return NextResponse.json({ error: 'This class is no longer accepting enrollments.' }, { status: 400 });
  }

  const { data: student } = await supabaseAdmin
    .from('User')
    .select('id, name, email')
    .eq('id', session.userId)
    .single();

  if (!student) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const { data: enrollment, error } = await supabaseAdmin
    .from('Enrollment')
    .insert({ studentId: session.userId, classId: params.id, paymentProofUrl })
    .select()
    .single();

  if (error || !enrollment) {
    console.error('Enrollment create error:', error);
    return NextResponse.json({ error: 'Failed to create enrollment.' }, { status: 500 });
  }

  void sendEnrollmentConfirmationEmail(
    student.email,
    student.name,
    classItem.title,
    classItem.subject,
    classItem.scheduleTime,
  );

  return NextResponse.json(enrollment, { status: 201 });
}
