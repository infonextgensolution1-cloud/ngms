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
    ]
  },
}

export default nextConfig
