// Icons live in /public/icons/{light,dark}/<slug>.svg
//   light = black + orange, for light backgrounds
//   dark  = white + orange, for dark backgrounds / over photos
// One set, one style (64px grid, 3px stroke, Solar Orange accent) — the 12
// service icons plus the general site icons used on the other pages.
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

export const SITE_ICON_SLUGS = [
  'crew',
  'fixed-price',
  'fast-reply',
  'local',
  'send-photo',
  'quote',
  'walkthrough',
  'phone',
  'mail',
  'calendar',
  'recurring',
  'winter-rain',
  'summer-sun',
  'complex',
  'invoice',
] as const

export type SiteIconSlug = (typeof SITE_ICON_SLUGS)[number]

const ALL_SLUGS: string[] = [...SERVICE_ICON_SLUGS, ...SITE_ICON_SLUGS]

export function serviceIcon(slug: string, variant: 'light' | 'dark' = 'dark'): string | null {
  return ALL_SLUGS.includes(slug) ? `/icons/${variant}/${slug}.svg` : null
}
