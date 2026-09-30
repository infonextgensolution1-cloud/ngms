// Snapshot of Vercel Web Analytics for the live site, shown at /admin/analytics.
//
// Vercel has no public API for reading Web Analytics, so these numbers are
// pulled by Claude (Vercel connector) and pasted in here. To refresh: ask
// Claude to "update the site analytics snapshot".
//
// Filter used for every figure: production only, excluding /admin pages and
// visits referred from vercel.com (the owner opening previews), so the
// numbers are closer to real clients. Days are UTC buckets (SAST minus 2h).

export type DailyTraffic = { date: string; visitors: number; pageviews: number }
export type CountRow = { label: string; path?: string; visitors: number; highlight?: boolean }

export type TrafficSnapshot = {
  project: string
  from: string
  to: string
  pulledOn: string
  totals: { visitors: number; pageviews: number; quoteVisitors: number; googleVisitors: number }
  daily: DailyTraffic[]
  pages: CountRow[]
  sources: CountRow[]
  devices: { mobile: number; desktop: number }
}

export const trafficSnapshot: TrafficSnapshot = {
  project: 'ngms-new',
  from: '2026-09-17',
  to: '2026-09-28',
  pulledOn: '2026-09-28',
  totals: { visitors: 63, pageviews: 554, quoteVisitors: 19, googleVisitors: 13 },
  daily: [
    { date: '2026-09-17', visitors: 3, pageviews: 6 },
    { date: '2026-09-18', visitors: 4, pageviews: 41 },
    { date: '2026-09-19', visitors: 1, pageviews: 1 },
    { date: '2026-09-20', visitors: 1, pageviews: 7 },
    { date: '2026-09-21', visitors: 3, pageviews: 4 },
    { date: '2026-09-22', visitors: 6, pageviews: 162 },
    { date: '2026-09-23', visitors: 12, pageviews: 117 },
    { date: '2026-09-24', visitors: 5, pageviews: 97 },
    { date: '2026-09-25', visitors: 9, pageviews: 37 },
    { date: '2026-09-26', visitors: 5, pageviews: 25 },
    { date: '2026-09-27', visitors: 5, pageviews: 11 },
    { date: '2026-09-28', visitors: 9, pageviews: 46 },
  ],
  pages: [
    { label: 'Home', path: '/', visitors: 41 },
    { label: 'Services', path: '/services', visitors: 24 },
    { label: 'Get a quote', path: '/quote', visitors: 19, highlight: true },
    { label: 'Maintenance packages', path: '/maintenance-packages', visitors: 18 },
    { label: 'Portfolio', path: '/portfolio', visitors: 16 },
    { label: 'Contact', path: '/contact', visitors: 15 },
    { label: 'Price list', path: '/price-list', visitors: 14 },
    { label: 'ROI calculator', path: '/roi-calculator', visitors: 14 },
    { label: 'FAQ', path: '/faq', visitors: 13 },
    { label: 'Gallery', path: '/gallery', visitors: 13 },
    { label: 'About', path: '/about', visitors: 12 },
    { label: 'Solar panel cleaning', path: '/services/solar-panel-cleaning', visitors: 10 },
  ],
  sources: [
    { label: 'Direct', visitors: 54 },
    { label: 'Google search', visitors: 13 },
    { label: 'Facebook', visitors: 4 },
    { label: 'WhatsApp Web link', visitors: 1 },
  ],
  devices: { mobile: 47, desktop: 16 },
}
