import type { MetadataRoute } from 'next'
import { services } from '@/lib/services'
import { solarLocations } from '@/lib/solar-locations'
import { SUBURBS } from '@/lib/suburbs'
import { SOLAR_SUBURB_TO_LOCATION } from '@/lib/solar-pricing'

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
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/quote`, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${BASE_URL}/services/${service.slug}`,
    changeFrequency: 'monthly',
    priority: service.slug === 'solar-panel-cleaning' ? 0.9 : 0.8,
  }))

  // Per-town solar pages, e.g. /solar-panel-cleaning/somerset-west
  const solarLocationPages: MetadataRoute.Sitemap = solarLocations.map((loc) => ({
    url: `${BASE_URL}/solar-panel-cleaning/${loc.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Service x suburb pages, e.g. /services/painting/strand. Solar ones are skipped where they
  // redirect to the richer /solar-panel-cleaning/[location] pages above (see next.config.mjs).
  const serviceSuburbPages: MetadataRoute.Sitemap = services.flatMap((service) =>
    SUBURBS.filter(
      (sub) => !(service.slug === 'solar-panel-cleaning' && SOLAR_SUBURB_TO_LOCATION[sub.slug]),
    ).map((sub) => ({
      url: `${BASE_URL}/services/${service.slug}/${sub.slug}`,
      changeFrequency: 'monthly' as const,
      priority: sub.region === 'Helderberg Basin' ? 0.6 : 0.5,
    })),
  )

  return [...staticPages, ...servicePages, ...solarLocationPages, ...serviceSuburbPages]
}
