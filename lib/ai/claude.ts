import Anthropic from '@anthropic-ai/sdk'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CONTEXT_HEADER } from '@/lib/prompt-library'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseClient'

/**
 * Server-side Claude helper for the admin AI buttons (app/api/ai/*).
 *
 * Vercel env vars:
 *   ANTHROPIC_API_KEY  required — from platform.claude.com → API keys. Never commit it.
 *   CLAUDE_MODEL       optional — defaults to claude-opus-5.
 *   STAFF_EMAILS       optional — comma-separated allowlist. When set, only these
 *                      signed-in accounts can use the AI routes.
 *
 * Every route requires the caller's Supabase access token (Authorization: Bearer …),
 * so the public can't spend API credit. Lead/quote reads go through that same token,
 * so Row Level Security applies exactly as it does in the browser.
 */

export const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5'

// If Claude declines a request, the API re-runs it on a fallback model inside the same call.
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01'

export const SYSTEM = `${CONTEXT_HEADER}

Money rules: prices are ZAR excluding VAT (NGMS is not VAT registered, so never add VAT). Default 70% deposit, 30% on completion. R350 callout outside the Helderberg Basin (e.g. Kleinmond, Grabouw, Elgin, Bot River, Hermanus). Winter (May–Aug) rain delays painting, waterproofing and paving, so mention weather-dependent scheduling where it matters.
Write in South African English. Never invent facts about a client, job or price that you weren't given; use [brackets] for anything the owner must fill in.`

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

/** Supabase client acting as the signed-in staff member, after checking their token. */
export async function requireStaff(request: Request): Promise<SupabaseClient> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Sign in to /admin first.')

  // Anon key is public by design (see lib/supabaseClient.ts); the user's JWT decides access.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Your session has expired. Sign in again.')

  const allow = (process.env.STAFF_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (allow.length && !allow.includes((data.user.email ?? '').toLowerCase())) {
    throw new HttpError(403, 'This account is not allowed to use the AI tools.')
  }
  return sb
}

let client: Anthropic | null = null

// Created on first use, not at import: a missing key must not break the site build (same as /api/notify).
export function claude(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, 'ANTHROPIC_API_KEY is missing in Vercel env vars. Add it, then redeploy.')
  }
  client ??= new Anthropic()
  return client
}

type Ask = {
  prompt: string
  maxTokens?: number
  effort?: 'low' | 'medium' | 'high'
  schema?: Record<string, unknown>
}

/** One request to Claude; returns the text answer (JSON text when `schema` is given). */
export async function ask({ prompt, maxTokens = 16000, effort = 'medium', schema }: Ask): Promise<string> {
  const stream = claude().beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort, ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  const msg = await stream.finalMessage()

  if (msg.stop_reason === 'refusal') {
    throw new HttpError(422, 'Claude declined this one. Reword the request and try again.')
  }
  const text = msg.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim()
  if (msg.stop_reason === 'max_tokens' && schema) {
    throw new HttpError(502, 'The answer was cut off. Try shorter notes.')
  }
  if (!text) throw new HttpError(502, 'Claude sent back an empty answer. Try again.')
  return text
}

/** Maps any thrown error to a JSON response the admin pages can show. */
export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status })
  if (e instanceof Anthropic.RateLimitError) {
    return Response.json({ error: 'Claude is busy right now. Try again in a minute.' }, { status: 429 })
  }
  if (e instanceof Anthropic.AuthenticationError) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is invalid. Check it in Vercel.' }, { status: 503 })
  }
  if (e instanceof Anthropic.APIError) {
    console.error('Claude API error', e.status, e.message)
    return Response.json({ error: `Claude API error (${e.status ?? 'network'}). Try again.` }, { status: 502 })
  }
  console.error('AI route error', e)
  return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
}
