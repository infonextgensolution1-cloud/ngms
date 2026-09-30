import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '@/lib/supabaseClient'

let client: SupabaseClient | null = null

/** Server-only Supabase client using the service-role key. Never import from client components. */
export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  client ??= createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
  return client
}
