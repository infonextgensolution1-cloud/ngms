// Service icons live in /public/icons/{light,dark}/<slug>.svg
//   light = black + orange, for light backgrounds
//   dark  = white + orange, for dark backgrounds / over photos
// Returns null for a slug with no icon so callers can simply skip it.

const SERVICE_ICON_SLUGS = [
  'solar-panel-cleaning',
  'painting',
  'waterproofing',
  'paving',
  'plumbing',
  'electrical',
  'pool-fibre-lining',
  'high-pressure-cleaning',
  'rubble-removal',
  'steelwork-welding',
  'handyman',
  'subcontractor-work',
]

export function serviceIcon(slug: string, variant: 'light' | 'dark' = 'dark'): string | null {
  return SERVICE_ICON_SLUGS.includes(slug) ? `/icons/${variant}/${slug}.svg` : null
}
