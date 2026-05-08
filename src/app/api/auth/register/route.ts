import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, city, password, role } = body || {};

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Name, email, phone, and password are required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        city,
        passwordHash,
        role: assignedRole,
        isVerified: assignedRole === 'STUDENT',
      },
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please check server logs or try again.' }, { status: 500 });
  }
}
