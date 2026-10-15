'use client'

import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { quotePhotoPath, signQuotePhoto } from '@/lib/quote-photo'

// Shows a customer's quote photo from the private bucket via a 1-hour signed URL
// (staff session required). Values that aren't quote-bucket photos are shown as-is.
function useLeadPhotoUrl(value: string | null | undefined): string | null {
  const isPrivate = quotePhotoPath(value) !== null
  const [url, setUrl] = useState<string | null>(isPrivate ? null : value ?? null)

  useEffect(() => {
    if (!value) return setUrl(null)
    if (!isPrivate) return setUrl(value)
    let cancelled = false
    signQuotePhoto(supabase, value, 3600).then((signed) => {
      if (!cancelled) setUrl(signed)
    })
    return () => {
      cancelled = true
    }
  }, [value, isPrivate])

  return url
}

export function LeadPhoto({ value }: { value: string | null | undefined }) {
  const url = useLeadPhotoUrl(value)
  if (!value) return null
  if (!url) return <p className="text-xs text-mist mt-3">Loading photo…</p>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Customer photo" className="rounded-lg max-h-72 w-auto border border-darkgrey" />
    </a>
  )
}

export function LeadPhotoLink({ value }: { value: string | null | undefined }) {
  const url = useLeadPhotoUrl(value)
  if (!value) return null
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View photo"
      aria-disabled={!url}
      className={`shrink-0 ${url ? 'text-blue' : 'text-mist pointer-events-none'}`}
    >
      <Camera className="w-4 h-4" />
    </a>
  )
}
