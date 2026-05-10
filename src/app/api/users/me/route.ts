import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(name && { name: name.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(city && { city: city.trim() }),
    },
    select: { id: true, name: true, email: true, phone: true, city: true, role: true, avatarUrl: true },
  });

  return NextResponse.json({ user: updated });
}
