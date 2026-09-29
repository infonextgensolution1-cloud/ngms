import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Staff-only tools and API routes — nothing here should show up in search results.
      disallow: ['/admin', '/ops', '/prompt-dashboard', '/api/', '/track/'],
    },
    sitemap: 'https://www.nextgensolarmaintenance.co.za/sitemap.xml',
  }
}
