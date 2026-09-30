import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dfwwpqtsbaytfqptancj.supabase.co'

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'REDACTED_PUBLIC_ANON_KEY'

export const SUPABASE_ANON_KEY = SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

export default supabase
