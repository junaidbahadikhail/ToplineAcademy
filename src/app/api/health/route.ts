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

async function getDailyStatus() {
  const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;
  const room = process.env.NEXT_PUBLIC_DAILY_ROOM;
  if (!domain || !room) return 'missing';
  try {
    const response = await fetch(`https://${domain}/${room}`, {
      method: 'HEAD', cache: 'no-store', redirect: 'manual',
    });
    return response.ok || [301, 302, 405].includes(response.status) ? 'reachable' : 'failed';
  } catch {
    return 'failed';
  }
}

function getOpenAIStatus() {
  return process.env.OPENAI_API_KEY ? 'configured' : 'missing';
}

export async function GET() {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: dbError } = await supabaseAdmin.from('User').select('id').limit(1);
  const databaseStatus = dbError ? 'failed' : 'connected';

  const [resendStatus, dailyStatus] = await Promise.all([getResendStatus(), getDailyStatus()]);

  return NextResponse.json({
    status: 'ok',
    database: databaseStatus,
    resend: resendStatus,
    daily: dailyStatus,
    openai: getOpenAIStatus(),
  });
}
