// NGSMS rate card for the quote builder — "from" prices in ZAR, EXCLUDING VAT.
// Tapping a line in /admin/quotes/new adds it to the quote; every price stays
// editable on the quote itself. Update the numbers here when rates change.

export type RateItem = { label: string; unit: string; price: number }
export type RateGroup = { group: string; slug: string; items: RateItem[] }

export const CALLOUT_FEE = 350 // flat, outside the Helderberg Basin

export const RATE_CARD: RateGroup[] = [
  {
    group: 'Solar panel cleaning',
    slug: 'solar-panel-cleaning',
    items: [
      { label: 'Solar panel clean — up to 10 panels', unit: 'job', price: 550 },
      { label: 'Solar panel clean — 11–20 panels', unit: 'job', price: 950 },
      { label: 'Solar panel clean — 21–30 panels', unit: 'job', price: 1350 },
      { label: 'Solar panel clean — 31–40 panels', unit: 'job', price: 1700 },
      { label: 'Solar panel clean — 41+ panels', unit: 'panel', price: 50 },
    ],
  },
  {
    group: 'High-pressure cleaning',
    slug: 'high-pressure-cleaning',
    items: [
      { label: 'High-pressure clean — driveway / paving', unit: 'm²', price: 28 },
      { label: 'High-pressure clean — exterior walls', unit: 'm²', price: 25 },
      { label: 'Roof soft wash', unit: 'm²', price: 32 },
      { label: 'High-pressure clean — boundary walls', unit: 'm²', price: 30 },
      { label: 'Full exterior wash package', unit: 'job', price: 2200 },
    ],
  },
  {
    group: 'Painting',
    slug: 'painting',
    items: [
      { label: 'Interior painting — 2 coats', unit: 'm²', price: 75 },
      { label: 'Exterior painting — 2 coats', unit: 'm²', price: 85 },
      { label: 'Ceilings — 2 coats', unit: 'm²', price: 65 },
      { label: 'Roof painting', unit: 'm²', price: 55 },
      { label: 'Feature wall (add-on)', unit: 'm²', price: 25 },
      { label: 'Old paint stripping', unit: 'm²', price: 80 },
      { label: 'Crack repair', unit: 'm', price: 65 },
    ],
  },
  {
    group: 'Waterproofing',
    slug: 'waterproofing',
    items: [
      { label: 'Acrylic / liquid membrane waterproofing', unit: 'm²', price: 180 },
      { label: 'Torch-on waterproofing — single layer', unit: 'm²', price: 260 },
      { label: 'Torch-on waterproofing — double layer', unit: 'm²', price: 340 },
      { label: 'Wall damp treatment', unit: 'm²', price: 120 },
      { label: 'Balcony full rebuild', unit: 'm²', price: 1400 },
    ],
  },
  { group: 'Paving', slug: 'paving', items: [{ label: 'New interlocking paving (compacted base)', unit: 'm²', price: 280 }] },
  { group: 'Plumbing', slug: 'plumbing', items: [{ label: 'Plumbing callout + first hour', unit: 'job', price: 850 }] },
  { group: 'Electrical', slug: 'electrical', items: [{ label: 'Electrical callout + first hour', unit: 'job', price: 950 }] },
  { group: 'Gutter cleaning', slug: 'gutter-cleaning', items: [{ label: 'Gutter cleaning', unit: 'house', price: 650 }] },
  { group: 'Pool fibre lining', slug: 'pool-fibre-lining', items: [{ label: 'Pool fibre lining', unit: 'm²', price: 450 }] },
  { group: 'Steelwork & welding', slug: 'steelwork-welding', items: [{ label: 'Steelwork / welding', unit: 'hour', price: 650 }] },
  { group: 'Rubble removal', slug: 'rubble-removal', items: [{ label: 'Rubble removal', unit: 'bakkie load', price: 1800 }] },
  { group: 'Handyman', slug: 'handyman', items: [{ label: 'Handyman (2-hour minimum)', unit: 'hour', price: 380 }] },
]

/** Solar tier price for a panel count (ex VAT). */
export function solarPrice(panels: number): { price: number; unit: string; quantity: number } {
  if (panels <= 10) return { price: 550, unit: 'job', quantity: 1 }
  if (panels <= 20) return { price: 950, unit: 'job', quantity: 1 }
  if (panels <= 30) return { price: 1350, unit: 'job', quantity: 1 }
  if (panels <= 40) return { price: 1700, unit: 'job', quantity: 1 }
  return { price: 50, unit: 'panel', quantity: panels }
}
