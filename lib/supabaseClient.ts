import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dfwwpqtsbaytfqptancj.supabase.co'

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd3dwcXRzYmF5dGZxcHRhbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTUwNjIsImV4cCI6MjEwMzA3MTA2Mn0.TYVt_DWr0jVhYOaeNFAyEFfv-_HpCqCzwDzdi3h0b6Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

export default supabase
