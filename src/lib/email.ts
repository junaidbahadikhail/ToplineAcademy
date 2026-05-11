import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Topline Academy <onboarding@resend.dev>';

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email]', err);
  }
}

function base(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#0f3d33;padding:28px 40px;">
  <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:.5px;">Topline Academy</p>
  <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.6);">Pakistan Online Classroom</p>
</td></tr>
<tr><td style="padding:36px 40px;">${content}</td></tr>
<tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Topline Academy · Karachi, Pakistan</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function btn(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#0f3d33;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;">${label} →</a>`;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://topline-academy.vercel.app';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  const safeName = escapeHtml(name);
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Welcome, ${safeName}!</h1>
    <p style="margin:0 0 16px;color:#475569;">Your ${escapeHtml(role.toLowerCase())} account on Topline Academy is ready.</p>
    ${role === 'INSTRUCTOR'
      ? `<p style="color:#64748b;font-size:14px;">Your instructor account is pending admin verification. You'll receive another email once approved.</p>`
      : `<p style="color:#64748b;font-size:14px;">Start browsing available classes and enroll in sessions that interest you.</p>`
    }
    ${btn(`${BASE_URL}/classes`, 'Browse Classes')}
  `);
  await send(to, 'Welcome to Topline Academy!', html);
}

export async function sendEnrollmentConfirmationEmail(
  to: string, name: string, className: string, subject: string, scheduleTime: string
) {
  const date = new Date(scheduleTime).toLocaleString('en-PK', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Karachi',
  });
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Enrollment Submitted</h1>
    <p style="margin:0 0 20px;color:#475569;">Hi ${escapeHtml(name)}, your enrollment request has been submitted for review.</p>
    <table style="width:100%;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;" cellpadding="16">
      <tr><td style="color:#64748b;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">Class</td><td style="font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(className)}</td></tr>
      <tr><td style="color:#64748b;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">Subject</td><td style="color:#334155;border-bottom:1px solid #e2e8f0;">${escapeHtml(subject)}</td></tr>
      <tr><td style="color:#64748b;font-size:13px;font-weight:600;">Schedule</td><td style="color:#334155;">${date} PKT</td></tr>
    </table>
    <p style="margin-top:16px;color:#64748b;font-size:14px;">Admin will review and approve your enrollment. Check your dashboard for updates.</p>
    ${btn(`${BASE_URL}/dashboard/student`, 'View Dashboard')}
  `);
  await send(to, `Enrollment submitted: ${className}`, html);
}

export async function sendEnrollmentApprovedEmail(
  to: string, name: string, className: string, scheduleTime: string, meetLink: string | null
) {
  const date = new Date(scheduleTime).toLocaleString('en-PK', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Karachi',
  });
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#15803d;">Enrollment Approved!</h1>
    <p style="margin:0 0 20px;color:#475569;">Great news, ${escapeHtml(name)}! Your enrollment in <strong>${escapeHtml(className)}</strong> has been approved.</p>
    <p style="color:#64748b;font-size:14px;"><strong>Session time:</strong> ${date} PKT</p>
    ${meetLink ? `<p style="color:#64748b;font-size:14px;"><strong>Room:</strong> ${escapeHtml(meetLink)}</p>` : ''}
    <p style="color:#64748b;font-size:14px;">Join the session from your student dashboard when it goes live.</p>
    ${btn(`${BASE_URL}/dashboard/student`, 'Open Dashboard')}
  `);
  await send(to, `Enrollment approved: ${className}`, html);
}

export async function sendEnrollmentRejectedEmail(to: string, name: string, className: string) {
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#b91c1c;">Enrollment Not Approved</h1>
    <p style="margin:0 0 16px;color:#475569;">Hi ${escapeHtml(name)}, unfortunately your enrollment request for <strong>${escapeHtml(className)}</strong> was not approved.</p>
    <p style="color:#64748b;font-size:14px;">Please contact us if you have questions or would like to apply for another class.</p>
    ${btn(`${BASE_URL}/classes`, 'Browse Other Classes')}
  `);
  await send(to, `Enrollment update: ${className}`, html);
}

export async function sendInstructorApprovedEmail(to: string, name: string) {
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#15803d;">Instructor Account Approved!</h1>
    <p style="margin:0 0 16px;color:#475569;">Hi ${escapeHtml(name)}, your instructor account has been verified by admin. You can now create and manage classes.</p>
    ${btn(`${BASE_URL}/dashboard/instructor`, 'Go to Instructor Dashboard')}
  `);
  await send(to, 'Your instructor account is approved', html);
}

export async function sendSessionStartingEmail(to: string, name: string, className: string, _meetLink: string) {
  const html = base(`
    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">Session Starting Now</h1>
    <p style="margin:0 0 16px;color:#475569;">Hi ${escapeHtml(name)}, your class <strong>${escapeHtml(className)}</strong> is live right now. Join before you miss it!</p>
    ${btn(`${BASE_URL}/dashboard/student`, 'Join Session')}
  `);
  await send(to, `LIVE NOW: ${className}`, html);
}

export { send as sendEmail };
