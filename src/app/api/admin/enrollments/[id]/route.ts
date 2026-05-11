import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { sendEnrollmentApprovedEmail, sendEnrollmentRejectedEmail } from '@/lib/email';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { status } = body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Status must be APPROVED or REJECTED.' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'APPROVED') updateData.approvedAt = new Date().toISOString();

  const { data: enrollment, error } = await supabaseAdmin
    .from('Enrollment')
    .update(updateData)
    .eq('id', params.id)
    .select('*, student:User!studentId(name, email), class:Class!classId(title, scheduleTime, meetLink)')
    .single();

  if (error || !enrollment) {
    console.error('Enrollment update error:', error);
    return NextResponse.json({ error: 'Failed to update enrollment.' }, { status: 500 });
  }

  const student = enrollment.student as { name: string; email: string } | null;
  const cls = enrollment.class as { title: string; scheduleTime: string; meetLink: string | null } | null;

  if (student && cls) {
    if (status === 'APPROVED') {
      void sendEnrollmentApprovedEmail(student.email, student.name, cls.title, cls.scheduleTime, cls.meetLink);
    } else {
      void sendEnrollmentRejectedEmail(student.email, student.name, cls.title);
    }
  }

  return NextResponse.json(enrollment);
}
