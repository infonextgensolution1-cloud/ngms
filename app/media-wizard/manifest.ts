import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NGMS Solar Forge Media Wizard',
    short_name: 'Solar Forge',
    description: 'NGMS media and campaign creation workspace.',
    start_url: '/media-wizard',
    scope: '/media-wizard',
    display: 'standalone',
    background_color: '#08090B',
    theme_color: '#08090B',
    orientation: 'portrait-primary',
    lang: 'en-ZA',
    icons: [
      { src: '/admin-app/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/admin-app/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
}
