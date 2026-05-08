import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend API key not configured for Topline Academy.');
    return;
  }

  await resend.emails.send({
    from: 'Topline Academy <noreply@yourdomain.com>', // Replace with your verified domain
    to,
    subject,
    html,
  });
}
