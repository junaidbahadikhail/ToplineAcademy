import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(1000).optional(),
  experience: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: user, error } = await supabaseAdmin
    .from('User')
    .select('id, name, email, phone, city, role, avatarUrl, bio, experience, createdAt')
    .eq('id', session.userId)
    .single();

  if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('User')
    .update(parsed.data)
    .eq('id', session.userId);

  if (error) return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  return NextResponse.json({ success: true });
}
