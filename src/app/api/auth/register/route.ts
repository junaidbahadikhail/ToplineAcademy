import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { RegisterSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid input.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, phone, city, password, role } = parsed.data;

    const { data: existing } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .insert({
        name,
        email: email.toLowerCase(),
        phone,
        city,
        passwordHash,
        role: assignedRole,
        isVerified: assignedRole === 'STUDENT',
      })
      .select('id, name, email, role')
      .single();

    if (error || !user) {
      console.error('Registration insert error:', error);
      return NextResponse.json({ error: 'Registration failed. Please check server logs or try again.' }, { status: 500 });
    }

    void sendWelcomeEmail(user.email, user.name, user.role);

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please check server logs or try again.' }, { status: 500 });
  }
}
