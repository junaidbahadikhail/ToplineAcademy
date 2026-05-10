import { NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];

export async function POST(request: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { classId, filename } = body as { classId?: string; filename?: string };

  if (!classId || !filename) {
    return NextResponse.json({ error: 'classId and filename are required.' }, { status: 400 });
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json(
      { error: 'File type not allowed. Use JPG, PNG, WEBP, GIF, or PDF.' },
      { status: 400 }
    );
  }

  const path = `${session.userId}/${classId}/${Date.now()}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from('payment-proofs')
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error('[storage] createSignedUploadUrl error:', error);
    return NextResponse.json({ error: 'Failed to create upload URL.' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path });
}

// Admin-only: returns a 1-hour signed download URL for a stored proof
export async function GET(request: Request) {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) return NextResponse.json({ error: 'path is required.' }, { status: 400 });

  const { data, error } = await supabaseAdmin.storage
    .from('payment-proofs')
    .createSignedUrl(path, 3600);

  if (error || !data) {
    console.error('[storage] createSignedUrl error:', error);
    return NextResponse.json({ error: 'Failed to generate download link.' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
