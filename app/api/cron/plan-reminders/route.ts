import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { REPLY_FROM, NOTIFY_TO } from '@/lib/lead-email'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Daily cron (vercel.json). Requires CRON_SECRET env var; Vercel sends it as a bearer token.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const db = supabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await db
    .from('plan_signups')
    .select('id,name,email,plan_name,interval_months,unsubscribe_token')
    .is('unsubscribed_at', null)
    .lte('next_reminder_date', today)
    .limit(50)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  for (const r of data ?? []) {
    const first = esc(String(r.name).split(/\s+/)[0])
    const unsub = `${site.url}/api/plan-unsubscribe?t=${r.unsubscribe_token}`
    const { error: sendErr } = await resend.emails.send({
      from: REPLY_FROM,
      to: r.email,
      subject: `Time for your ${r.plan_name} visit`,
      replyTo: NOTIFY_TO,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;max-width:560px"><p>Hi ${first},</p><p>It's time for your next <strong>${esc(r.plan_name)}</strong> visit. Reply to this email or WhatsApp us on <a href="https://wa.me/${site.whatsapp}">${site.phoneDisplay}</a> and we'll book a day that suits you (and the weather).</p><p>Regards,<br>The NextGen team</p><p style="font-size:12px;color:#777">Don't want reminders? <a href="${unsub}">Unsubscribe</a>.</p></div>`,
      text: `Hi ${String(r.name).split(/\s+/)[0]},\n\nIt's time for your next ${r.plan_name} visit. Reply here or WhatsApp ${site.phoneDisplay} to book.\n\nUnsubscribe: ${unsub}`,
      headers: { 'List-Unsubscribe': `<${unsub}>` },
    })
    if (sendErr) {
      console.error('plan reminder failed', r.id, sendErr.message)
      continue
    }
    const next = new Date()
    next.setMonth(next.getMonth() + r.interval_months)
    await db.from('plan_signups').update({ last_reminded_at: new Date().toISOString(), next_reminder_date: next.toISOString().slice(0, 10) }).eq('id', r.id)
    sent++
  }
  return NextResponse.json({ ok: true, due: data?.length ?? 0, sent })
}
