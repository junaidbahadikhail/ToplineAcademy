import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

export async function GET(request: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  let query = supabaseAdmin
    .from('User')
    .select('id, name, email, phone, city, role, isVerified, isActive, createdAt, Enrollment!studentId(id)')
    .order('createdAt', { ascending: false });

  if (role) {
    query = query.eq('role', role);
  } else {
    query = query.in('role', ['STUDENT', 'INSTRUCTOR']);
  }

  const { data: users } = await query;

  const result = (users ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    city: u.city,
    role: u.role,
    isVerified: u.isVerified,
    isActive: u.isActive,
    createdAt: u.createdAt,
    _count: { enrollments: (u.Enrollment as { id: string }[] | null)?.length ?? 0 },
  }));

  return NextResponse.json(result);
}
