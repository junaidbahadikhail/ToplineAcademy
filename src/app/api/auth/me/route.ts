import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('id, name, email, role, isActive, avatarUrl')
    .eq('id', session.userId)
    .single();

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
