import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/get-session';

const resendClient = new Resend(process.env.RESEND_API_KEY);

async function getResendStatus() {
  if (!process.env.RESEND_API_KEY) return 'missing';
  try {
    const result = await resendClient.apiKeys.list({ limit: 1 });
    return result.error ? 'failed' : 'healthy';
  } catch {
    return 'failed';
  }
}

function getLiveKitStatus() {
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) return 'missing';
  return 'configured';
}

function getOpenAIStatus() {
  return process.env.OPENAI_API_KEY ? 'configured' : 'missing';
}

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error: dbError } = await supabaseAdmin.from('User').select('id').limit(1);
  const databaseStatus = dbError ? 'failed' : 'connected';

  const resendStatus = await getResendStatus();

  return NextResponse.json({
    status: 'ok',
    database: databaseStatus,
    resend: resendStatus,
    livekit: getLiveKitStatus(),
    openai: getOpenAIStatus(),
  });
}
