import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { createOrGetDailyRoom, hasDailyDomain } from '@/lib/daily';

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
    .select('id, title, type, meetLink')
    .eq('id', params.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = { isApproved };

  // Auto-create a Daily.co room when approving a LIVE class that doesn't have one yet
  if (isApproved && existing.type === 'LIVE' && !existing.meetLink && hasDailyDomain()) {
    const slug = (existing.title as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    const roomName = `tl-${params.id.slice(0, 8)}-${slug}`;
    const roomUrl = await createOrGetDailyRoom(roomName);
    if (roomUrl) {
      updatePayload.meetLink = roomName;
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('Class')
    .update(updatePayload)
    .eq('id', params.id)
    .select('id, isApproved, meetLink')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update class.' }, { status: 500 });
  }

  return NextResponse.json(updated);
}
