'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('NGMS application error:', error) }, [error])
  return (
    <main className="ngms-system-state">
      <section className="ngms-system-state__panel" aria-labelledby="system-error-title">
        <p className="ngms-system-state__eyebrow">NGMS / System status</p>
        <h1 id="system-error-title" className="ngms-system-state__title">Something went wrong.</h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed">The page could not finish loading. Your existing account and job records have not been intentionally changed by this screen.</p>
        {error.digest ? <p className="mt-3 text-xs text-neutral-600">Reference: {error.digest}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="ngms-system-state__action" onClick={() => reset()}>Try again <span aria-hidden="true">↗</span></button>
          <Link className="ngms-system-state__action" href="/">Return home <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  )
}
