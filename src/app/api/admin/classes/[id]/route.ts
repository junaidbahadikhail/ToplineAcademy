import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

interface ClassParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: ClassParams) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { isApproved } = body as { isApproved?: boolean };
  if (typeof isApproved !== 'boolean') {
    return NextResponse.json({ error: 'Missing approval flag.' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('Class')
    .select('id')
    .eq('id', params.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('Class')
    .update({ isApproved })
    .eq('id', params.id)
    .select('id, isApproved')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update class.' }, { status: 500 });
  }

  return NextResponse.json(updated);
}
