import type { SupabaseClient } from '@supabase/supabase-js'

// Quote-request photos live in the PRIVATE "public-leads" bucket (the name is
// historical). leads.photo_url stores a reference, not a public URL:
//
//   sb://public-leads/quote-photos/2026-10/<uuid>.jpg
//
// To show a photo, staff create a short-lived signed URL (RLS: active staff
// only). Older rows may still hold a full public URL; those are recognised too.

export const QUOTE_PHOTO_BUCKET = 'public-leads'
export const QUOTE_PHOTO_PREFIX = 'quote-photos/'
const REF_PREFIX = `sb://${QUOTE_PHOTO_BUCKET}/`
const LEGACY_MARKER = `/storage/v1/object/public/${QUOTE_PHOTO_BUCKET}/`

export function quotePhotoRef(path: string): string {
  return REF_PREFIX + path
}

/** Storage path for a stored photo value, or null if it isn't a quote photo. */
export function quotePhotoPath(value: string | null | undefined): string | null {
  if (!value) return null
  let path: string | null = null
  if (value.startsWith(REF_PREFIX)) path = value.slice(REF_PREFIX.length)
  else {
    const i = value.indexOf(LEGACY_MARKER)
    if (i !== -1) path = decodeURIComponent(value.slice(i + LEGACY_MARKER.length).split('?')[0])
  }
  // Only ever sign files from the quote-photos folder, never arbitrary paths.
  if (!path || !path.startsWith(QUOTE_PHOTO_PREFIX) || path.includes('..')) return null
  return path
}

/** Signed URL for a stored photo value; null if it can't be signed. */
export async function signQuotePhoto(sb: SupabaseClient, value: string | null | undefined, seconds: number): Promise<string | null> {
  const path = quotePhotoPath(value)
  if (!path) return null
  const { data, error } = await sb.storage.from(QUOTE_PHOTO_BUCKET).createSignedUrl(path, seconds)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
