import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

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

function getNotionStatus() {
  if (!process.env.NOTION_API_KEY) return 'missing';
  const dbs = [process.env.NOTION_ENROLLMENTS_DB, process.env.NOTION_CLASSES_DB, process.env.NOTION_MEETINGS_DB];
  if (dbs.some((d) => !d)) return 'partially configured';
  return 'configured';
}

function getOpenAIStatus() {
  return process.env.OPENAI_API_KEY ? 'configured' : 'missing';
}

export async function GET() {
  const databaseStatus = await prisma
    .$queryRaw`SELECT 1 as result`
    .then(() => 'connected')
    .catch(() => 'failed');

  const [resendStatus, dailyStatus] = await Promise.all([getResendStatus(), getDailyStatus()]);

  return NextResponse.json({
    status: 'ok',
    database: databaseStatus,
    resend: resendStatus,
    daily: dailyStatus,
    notion: getNotionStatus(),
    openai: getOpenAIStatus(),
  });
}
