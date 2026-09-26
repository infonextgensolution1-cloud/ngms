import { Resend } from 'resend'

// Lead alert emails to Jacques (quote form via /api/notify, chat bookings via /api/chat).
// RESEND_API_KEY lives in Vercel env vars. The client is created per call, never at
// import, so a missing key can't break the site build.
export const NOTIFY_TO = 'info.nextgensolution1@gmail.com'
export const NOTIFY_FROM = 'NGSMS Website <leads@nextgensolarmaintenance.co.za>'

export async function sendLeadEmail(subject: string, lines: string[], replyTo?: string | null): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    subject,
    text: lines.join('\n'),
    replyTo: replyTo || undefined,
  })
  if (error) throw new Error(error.message)
}
