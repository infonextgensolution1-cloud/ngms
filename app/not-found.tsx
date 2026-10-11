import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="ngms-system-state">
      <section className="ngms-system-state__panel" aria-labelledby="not-found-title">
        <p className="ngms-system-state__eyebrow">NGMS / 404</p>
        <h1 id="not-found-title" className="ngms-system-state__title">Page not found.</h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed">This address may have changed or the page may no longer be available. Choose a destination below to continue.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="ngms-system-state__action" href="/">Home <span aria-hidden="true">↗</span></Link>
          <Link className="ngms-system-state__action" href="/contact">Contact NGMS <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  )
}
