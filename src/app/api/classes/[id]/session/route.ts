import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { createOrGetDailyRoom } from '@/lib/daily';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || (session.role !== 'INSTRUCTOR' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { action } = await request.json();

  const { data: classItem } = await supabaseAdmin
    .from('Class')
    .select('id, instructorId, title, meetLink')
    .eq('id', params.id)
    .single();

  if (!classItem) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
  if (classItem.instructorId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Not your class.' }, { status: 403 });
  }

  const status = action === 'start' ? 'LIVE_NOW' : 'ENDED';

  // When starting, auto-create a Daily.co room if configured and no room exists
  let meetLink = classItem.meetLink;
  if (action === 'start') {
    const slug = (classItem.title as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    const roomName = `tl-${params.id.slice(0, 8)}-${slug}`;
    const roomUrl = await createOrGetDailyRoom(roomName);
    if (roomUrl) {
      meetLink = roomName; // store room name; URL is constructed at join time
      await supabaseAdmin.from('Class').update({ meetLink }).eq('id', params.id);
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('Class')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update class status.' }, { status: 500 });
  }

  return NextResponse.json(updated);
}
