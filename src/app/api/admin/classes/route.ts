import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

export async function GET(request: Request) {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('Class')
    .select('*, instructor:User!instructorId(id, name, email)')
    .order('scheduleTime', { ascending: true });

  if (status === 'PENDING') query = query.eq('isApproved', false);
  else if (status === 'APPROVED') query = query.eq('isApproved', true);

  const { data: classes } = await query;

  return NextResponse.json(
    (classes ?? []).map((cls) => {
      const instructor = cls.instructor as { id: string; name: string; email: string } | null;
      return {
        id: cls.id,
        title: cls.title,
        subject: cls.subject,
        description: cls.description,
        scheduleTime: cls.scheduleTime,
        feePkr: cls.feePkr,
        maxStudents: cls.maxStudents,
        status: cls.status,
        isApproved: cls.isApproved,
        instructor: instructor ?? { id: '', name: 'Unknown', email: '' },
      };
    })
  );
}
