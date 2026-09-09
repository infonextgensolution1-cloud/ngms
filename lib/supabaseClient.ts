lib/supabaseClient.tsimport { createClient } from '@supabase/supabase-js'

// Supabase project: NGMS (dfwwpqtsbaytfqptancj)
//
// The anon/publishable key is PUBLIC by design — it is shipped to the browser
// on every page load regardless. Access is controlled by Row Level Security
// policies on the database, not by keeping this string secret.
//
// Env vars are still read first, so you can override these per-environment
// later without touching code. If the env vars are missing or misconfigured,
// these values are used instead — which is why the admin login no longer
// breaks with "Invalid API key" when a Vercel variable goes missing.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dfwwpqtsbaytfqptancj.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd3dwcXRzYmF5dGZxcHRhbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTUwNjIsImV4cCI6MjEwMzA3MTA2Mn0.TYVt_DWr0jVhYOaeNFAyEFfv-_HpCqCzwDzdi3h0b6Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
