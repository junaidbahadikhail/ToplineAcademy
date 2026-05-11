import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { sendInstructorApprovedEmail } from '@/lib/email';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { role, isVerified, isActive } = body;

  const { data: before } = await supabaseAdmin
    .from('User')
    .select('role, isVerified')
    .eq('id', params.id)
    .single();

  const updateData: Record<string, unknown> = {};
  if (role !== undefined) updateData.role = role;
  if (isVerified !== undefined) updateData.isVerified = isVerified;
  if (isActive !== undefined) updateData.isActive = isActive;

  const { data: user, error } = await supabaseAdmin
    .from('User')
    .update(updateData)
    .eq('id', params.id)
    .select('id, name, email, role, isVerified, isActive')
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }

  if (
    isVerified === true &&
    before &&
    !before.isVerified &&
    (before.role === 'INSTRUCTOR' || role === 'INSTRUCTOR')
  ) {
    void sendInstructorApprovedEmail(user.email, user.name);
  }

  return NextResponse.json(user);
}
