import { Resend } from 'resend'
import { site } from '@/lib/site'

export const NOTIFY_TO = 'info.nextgensolution1@gmail.com'
export const NOTIFY_FROM = 'NGSMS Website <leads@nextgensolarmaintenance.co.za>'
export const REPLY_FROM = 'NextGen Solar Clean & Maintenance <leads@nextgensolarmaintenance.co.za>'

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

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Friendly "we got your request" email to the customer. Replies go to the business inbox. */
export async function sendCustomerAutoReply(opts: {
  to: string
  name: string
  service?: string | null
  suburb?: string | null
  estimateLine?: string | null
}): Promise<void> {
  const first = esc(opts.name.trim().split(/\s+/)[0] || 'there')
  const service = opts.service ? esc(opts.service) : 'your job'
  const suburb = opts.suburb ? ` in ${esc(opts.suburb)}` : ''
  const estimate = opts.estimateLine ? `<p style="margin:0 0 14px">${esc(opts.estimateLine)}</p>` : ''
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:560px">
<p style="margin:0 0 14px">Hi ${first},</p>
<p style="margin:0 0 14px">Thanks for contacting NextGen Solar Clean &amp; Maintenance Solutions. We've received your request for <strong>${service}</strong>${suburb}.</p>
${estimate}
<p style="margin:0 0 14px">We normally reply within one business day with a firm quote. If it's urgent, WhatsApp us on <a href="https://wa.me/${site.whatsapp}">${site.phoneDisplay}</a>.</p>
<p style="margin:0 0 14px">Tip: photos of the job help us quote faster and more accurately.</p>
<p style="margin:0">Regards,<br>The NextGen team<br>Strand · Gordon's Bay · Somerset West</p>
</div>`
  const text = `Hi ${opts.name.trim().split(/\s+/)[0] || 'there'},\n\nThanks for contacting NextGen Solar Clean & Maintenance Solutions. We've received your request for ${opts.service || 'your job'}${opts.suburb ? ' in ' + opts.suburb : ''}.\n${opts.estimateLine ? '\n' + opts.estimateLine + '\n' : ''}\nWe normally reply within one business day with a firm quote. Urgent? WhatsApp ${site.phoneDisplay}.\n\nRegards,\nThe NextGen team`
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: REPLY_FROM,
    to: opts.to,
    subject: 'We got your request — NextGen Solar & Maintenance',
    html,
    text,
    replyTo: NOTIFY_TO,
  })
  if (error) throw new Error(error.message)
}
