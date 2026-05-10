import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

export async function PATCH(request: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, phone, city } = body as { name?: string; phone?: string; city?: string };

  if (phone) {
    const phoneClean = phone.replace(/[\s-]/g, '');
    if (!/^([+]92\d{10}|03\d{9})$/.test(phoneClean)) {
      return NextResponse.json(
        { error: 'Phone must be a valid Pakistani number (e.g. 0312 1234567).' },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name.trim();
  if (phone) updateData.phone = phone.trim();
  if (city) updateData.city = city.trim();

  const { data: updated, error } = await supabaseAdmin
    .from('User')
    .update(updateData)
    .eq('id', session.userId)
    .select('id, name, email, phone, city, role, avatarUrl')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }

  return NextResponse.json({ user: updated });
}
