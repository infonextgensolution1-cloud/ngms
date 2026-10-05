import { getSuburb } from '@/lib/suburbs'

/**
 * Which service-by-area pages Google should index. Each of these pages is a short, templated
 * page (about 80% of its text is shared with the same service in other areas), so only the ones
 * worth ranking are indexed. The rest still work for visitors; they carry "noindex, follow" and
 * stay out of the sitemap. Both the page metadata and the sitemap call this one function, so
 * they cannot drift apart. To bring a page back, change the rule here.
 *
 *  - Overberg areas are out-of-basin (R350 callout), lower value, so not indexed.
 *  - Subcontractor work is a B2B offer, not something people search for by suburb.
 */
export const NOINDEX_SERVICE_SLUGS: readonly string[] = ['subcontractor-work']

export function isIndexableServiceArea(serviceSlug: string, suburbSlug: string): boolean {
  const sub = getSuburb(suburbSlug)
  if (!sub) return false
  if (sub.region !== 'Helderberg Basin') return false
  return !NOINDEX_SERVICE_SLUGS.includes(serviceSlug)
}
