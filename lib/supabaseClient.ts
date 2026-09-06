import { createClient } from '@supabase/supabase-js'

// Fallback placeholders so a missing/misconfigured env var can never take down
// the entire production build. If these are in use, Supabase calls will fail
// gracefully at runtime instead of crashing every page on the site.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
