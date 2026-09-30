import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const page = (msg: string, status = 200) =>
  new Response(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:Arial,sans-serif;max-width:480px;margin:15vh auto;padding:0 16px"><h2>${msg}</h2><p><a href="/">Back to the website</a></p>`, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('t') ?? ''
  if (!/^[a-f0-9]{32,80}$/i.test(t)) return page('Invalid unsubscribe link.', 400)
  const { error } = await supabaseAdmin().from('plan_signups').update({ unsubscribed_at: new Date().toISOString() }).eq('unsubscribe_token', t)
  if (error) return page('Something went wrong. Please email us to unsubscribe.', 500)
  return page("You've been unsubscribed from service reminders.")
}
