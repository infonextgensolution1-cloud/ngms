import { createClient } from "@supabase/supabase-js";

// Public Supabase project URL + anon/publishable key.
// Safe to ship client-side: row-level security policies restrict
// anonymous access to public reads (services, hero slides, gallery,
// posts) and lead-form inserts only.
const SUPABASE_URL = "https://dfwwpqtsbaytfqptancj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd3dwcXRzYmF5dGZxcHRhbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTUwNjIsImV4cCI6MjEwMzA3MTA2Mn0.TYVt_DWr0jVhYOaeNFAyEFfv-_HpCqCzwDzdi3h0b6Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
