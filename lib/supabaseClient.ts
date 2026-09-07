import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Build-safe placeholders: a missing env var must never crash the production
// build. But unlike a silent fallback, this shouts loudly in the browser
// console at runtime so a misconfiguration can't hide as "the form just
// doesn't work" — which is exactly how the VITE_PUBLIC_ prefix bug went
// unnoticed and quietly dropped every incoming lead.
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured && typeof window !== 'undefined') {
  console.error(
    '[NGMS] Supabase is NOT configured. NEXT_PUBLIC_SUPABASE_URL and/or ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY are missing from this build. Lead capture, ' +
      'admin login and all gallery data WILL fail. Set them in Vercel, then redeploy ' +
      '(NEXT_PUBLIC_ vars are baked in at build time).'
  )
}

export const supabaseConfigured = isConfigured

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
