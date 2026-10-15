'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Admin route error:', error) }, [error])
  return <main className="ngms-system-state"><section className="ngms-system-state__panel" aria-labelledby="admin-error-title"><p className="ngms-system-state__eyebrow">NGMS / ADMIN / SYSTEM STATUS</p><h1 id="admin-error-title" className="ngms-system-state__title">Something went wrong.</h1><p className="mt-5 max-w-xl text-sm leading-relaxed">This admin page could not finish loading. Please retry, or return to your admin area.</p>{error.digest ? <p className="mt-3 text-xs text-neutral-600">Reference: {error.digest}</p> : null}<div className="mt-5 flex flex-wrap gap-3"><button type="button" className="ngms-system-state__action" onClick={() => reset()}>Try again <span aria-hidden="true">↗</span></button><Link className="ngms-system-state__action" href="/admin">Return to admin <span aria-hidden="true">↗</span></Link></div></section></main>
}
