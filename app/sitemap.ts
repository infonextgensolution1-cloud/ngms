import type { MetadataRoute } from 'next'
import { services } from '@/lib/services'

const BASE_URL = 'https://www.nextgensolarmaintenance.co.za'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/portfolio`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/gallery`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/price-list`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/maintenance-packages`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/roi-calculator`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/quote`, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${BASE_URL}/services/${service.slug}`,
    changeFrequency: 'monthly',
    priority: service.slug === 'solar-panel-cleaning' ? 0.9 : 0.8,
  }))

  return [...staticPages, ...servicePages]
}
