import { supabase } from '@/lib/supabaseClient'

// Browser helper for the admin AI routes (app/api/ai/*). Sends the staff member's
// Supabase token so the server can check they're signed in.

export type DraftLine = { description: string; quantity: number; unit: string; unit_price: number; service_slug: string }
export type QuoteDraft = { lines: DraftLine[]; scope_notes: string; questions: string[] }

export async function callAi<T>(route: 'run-prompt' | 'lead-reply' | 'quote-lines', body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sign in to /admin first.')

  const res = await fetch(`/api/ai/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status}).`)
  return json
}
