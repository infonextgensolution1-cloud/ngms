import Link from 'next/link'

export default function PortalNotFound() {
  return <main className="ngms-system-state"><section className="ngms-system-state__panel" aria-labelledby="portal-not-found-title"><p className="ngms-system-state__eyebrow">NGMS / PORTAL / 404</p><h1 id="portal-not-found-title" className="ngms-system-state__title">Page not found.</h1><p className="mt-5 max-w-xl text-sm leading-relaxed">This portal address may have changed or may not be available to your account.</p><Link className="ngms-system-state__action" href="/portal">Return to portal <span aria-hidden="true">↗</span></Link></section></main>
}
