import Link from 'next/link'

export default function AdminNotFound() {
  return <main className="ngms-system-state"><section className="ngms-system-state__panel" aria-labelledby="admin-not-found-title"><p className="ngms-system-state__eyebrow">NGMS / ADMIN / 404</p><h1 id="admin-not-found-title" className="ngms-system-state__title">Page not found.</h1><p className="mt-5 max-w-xl text-sm leading-relaxed">This admin address may have changed or may not be available to your account.</p><Link className="ngms-system-state__action" href="/admin">Return to admin <span aria-hidden="true">↗</span></Link></section></main>
}
