/** @type {import('next').NextConfig} */

// Old duplicate solar area pages → the full per-town solar pages (keeps SEO in one place).
const SOLAR_AREA_REDIRECTS = {
  strand: 'strand',
  'gordons-bay': 'gordons-bay',
  'somerset-west': 'somerset-west',
  kleinmond: 'kleinmond',
  grabouw: 'grabouw-elgin',
  elgin: 'grabouw-elgin',
  'bot-river': 'bot-river',
}

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async redirects() {
    return [
      { source: '/projects', destination: '/portfolio', permanent: true },
      ...Object.entries(SOLAR_AREA_REDIRECTS).map(([from, to]) => ({
        source: `/services/solar-panel-cleaning/${from}`,
        destination: `/solar-panel-cleaning/${to}`,
        permanent: true,
      })),
      // Older standalone solar pages that competed with the per-town pages for the same searches.
      { source: '/solar-panel-cleaning-helderberg', destination: '/services/solar-panel-cleaning', permanent: true },
      { source: '/solar-maintenance-somerset-west', destination: '/solar-panel-cleaning/somerset-west', permanent: true },
      { source: '/solar-cleaning-gordons-bay-overberg', destination: '/solar-panel-cleaning/gordons-bay', permanent: true },
      // Duplicate price and package pages.
      { source: '/prices', destination: '/price-list', permanent: true },
      { source: '/packages', destination: '/maintenance-packages', permanent: true },
    ]
  },
  async rewrites() {
    return [
      // Campaign landing pages: standalone HTML in public/, served without the site header/footer.
      { source: '/spring-solar', destination: '/spring-solar.html' },
    ]
  },
}

export default nextConfig
