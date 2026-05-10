import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    { count: totalStudents },
    { count: totalInstructors },
    { count: pendingEnrollments },
    { count: pendingClasses },
    { count: totalClasses },
  ] = await Promise.all([
    supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
    supabaseAdmin.from('User').select('*', { count: 'exact', head: true }).eq('role', 'INSTRUCTOR'),
    supabaseAdmin.from('Enrollment').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabaseAdmin.from('Class').select('*', { count: 'exact', head: true }).eq('isApproved', false),
    supabaseAdmin.from('Class').select('*', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({ totalStudents, totalInstructors, pendingEnrollments, pendingClasses, totalClasses });
}
