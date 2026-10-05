import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { REPLY_FROM, NOTIFY_TO } from '@/lib/lead-email'
import { buildFollowUpEmail, type DueLead } from '@/lib/lead-followup-email'
import { todaySAST } from '@/lib/ngms-leads-ui'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

// Daily cron (vercel.json, 06:00 UTC = 08:00 SAST). Emails the owner one digest of open
// leads whose follow-up date is today or earlier. Sends nothing when none are due.
// Requires CRON_SECRET (same as plan-reminders); Vercel sends it as a bearer token.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('leads')
    .select('id,name,phone,service,service_slug,suburb,status,notes,follow_up_at')
    .not('status', 'in', '(won,lost)')
    .not('follow_up_at', 'is', null)
    .lte('follow_up_at', todaySAST())
    .order('follow_up_at', { ascending: true })
    .limit(50)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const due = (data ?? []) as DueLead[]
  if (!due.length) return NextResponse.json({ ok: true, due: 0, sent: false })

  const { subject, html, text } = buildFollowUpEmail(due, site.url)
  const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: REPLY_FROM,
    to: NOTIFY_TO,
    subject,
    html,
    text,
  })
  if (sendError) {
    console.error('lead follow-up email failed', sendError.message)
    return NextResponse.json({ ok: false, due: due.length, error: sendError.message }, { status: 502 })
  }
  return NextResponse.json({ ok: true, due: due.length, sent: true })
}
