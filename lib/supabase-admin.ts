import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL

let client: SupabaseClient | null = null

/** Server-only Supabase client using the service-role key. Never import from client components. */
export function supabaseAdmin(): SupabaseClient {
  const url = SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  client ??= createClient(url, key, { auth: { persistSession: false } })
  return client
}
