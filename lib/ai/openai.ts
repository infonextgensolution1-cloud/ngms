import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CONTEXT_HEADER } from '@/lib/prompt-library'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseClient'

/**
 * Server-side OpenAI helper for the admin AI buttons (app/api/ai/*).
 *
 * Vercel env vars:
 *   OPENAI_API_KEY  required
 *   OPENAI_MODEL    optional — defaults to gpt-6-luna.
 *   STAFF_EMAILS    optional — comma-separated allowlist.
 *
 * Uses the OpenAI Responses API directly so the site does not need a second
 * provider SDK dependency. See OpenAI's current Responses API guidance.
 */

export const MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna'

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
  const token = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '')
  if (!token) throw new HttpError(401, 'Sign in to /admin first.')

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Your session has expired. Sign in again.')

  if (jwtAal(token) !== 'aal2') throw new HttpError(403, MFA_REQUIRED_MESSAGE)

  const allow = (process.env.STAFF_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (allow.length && !allow.includes((data.user.email ?? '').toLowerCase())) {
    throw new HttpError(403, 'This account is not allowed to use the AI tools.')
  }
  return sb
}

type Ask = {
  prompt: string
  maxTokens?: number
  effort?: 'low' | 'medium' | 'high'
  schema?: Record<string, unknown>
}

export async function ask({ prompt, maxTokens = 16000, effort = 'medium', schema }: Ask): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new HttpError(503, 'OPENAI_API_KEY is missing in Vercel env vars. Add it, then redeploy.')
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    instructions: SYSTEM,
    input: prompt,
    max_output_tokens: maxTokens,
  }

  if (schema) {
    body.text = {
      format: {
        type: 'json_schema',
        name: 'ngms_ai_output',
        strict: true,
        schema,
      },
    }
  }

  if (effort !== 'low') {
    body.reasoning = { effort }
  }

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (e) {
    console.error('OpenAI network error', e)
    throw new HttpError(503, 'The OpenAI service is temporarily unavailable. Try again shortly.')
  }

  const data = (await response.json().catch(() => ({}))) as {
    output_text?: string
    error?: { message?: string; type?: string }
    status?: string
  }

  if (!response.ok) {
    console.error('OpenAI API error', response.status, data.error?.message ?? 'unknown error')
    if (response.status === 401) {
      throw new HttpError(503, 'The AI service is not configured correctly. Check the OpenAI API key in Vercel.')
    }
    if (response.status === 429) {
      throw new HttpError(429, 'OpenAI is temporarily rate-limited or out of available credit. Try again shortly.')
    }
    throw new HttpError(503, 'The OpenAI AI service is temporarily unavailable. Try again shortly.')
  }

  const text = String(data.output_text ?? '').trim()
  if (!text) throw new HttpError(502, 'OpenAI sent back an empty answer. Try again.')
  return text
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status })
  console.error('AI route error', e)
  return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
}
