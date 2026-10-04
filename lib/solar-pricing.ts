// Single source of truth for solar panel cleaning price tiers (excl. VAT).
// Used on the flagship service page and every per-town solar page.
export const SOLAR_TIERS = [
  { size: 'Up to 10 panels', price: 'from R550' },
  { size: '11–20 panels', price: 'from R950' },
  { size: '21–30 panels', price: 'from R1 350' },
  { size: '31–40 panels', price: 'from R1 700' },
  { size: '41+ panels', price: 'from R50/panel' },
]

// Service-page suburb slugs → the richer /solar-panel-cleaning/[location] pages.
export const SOLAR_SUBURB_TO_LOCATION: Record<string, string> = {
  strand: 'strand',
  'gordons-bay': 'gordons-bay',
  'somerset-west': 'somerset-west',
  kleinmond: 'kleinmond',
  grabouw: 'grabouw-elgin',
  elgin: 'grabouw-elgin',
  'bot-river': 'bot-river',
}

// Starting price (ZAR, excl. VAT) for one solar clean, matching SOLAR_TIERS above.
// Used by the ROI calculator so the calculator can never drift from the price list.
export function solarCleanFromPrice(panels: number): number {
  if (panels <= 10) return 550
  if (panels <= 20) return 950
  if (panels <= 30) return 1350
  if (panels <= 40) return 1700
  return panels * 50
}

// Thousands with a space ("2 977"), identical on the server and in every browser.
// (toLocaleString('en-ZA') differs between Node and browsers, which breaks hydration.)
export function groupThousands(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
