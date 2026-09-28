// Quote bundles: common jobs that add several lines at once from one measurement.
// Prices always come from RATE_CARD (lib/rate-card.ts), so changing a rate there
// changes every bundle that uses it. Add or edit bundles here.

import { RATE_CARD, solarPrice } from '@/lib/rate-card'

export type BundleLine = { description: string; quantity: number; unit: string; unit_price: number; service_slug: string }
export type Bundle = {
  id: string
  name: string
  ask: string // what to measure, shown as the input placeholder
  unit: 'm²' | 'panels'
  lines: (size: number) => BundleLine[]
}

function rate(label: string): { unit: string; price: number; slug: string } {
  for (const g of RATE_CARD) {
    const it = g.items.find((i) => i.label === label)
    if (it) return { unit: it.unit, price: it.price, slug: g.slug }
  }
  throw new Error(`Rate card has no line called "${label}"`)
}

/** One line priced from the rate card at `qty` of its unit. */
function line(label: string, qty: number, description = label): BundleLine {
  const r = rate(label)
  return { description, quantity: qty, unit: r.unit, unit_price: r.price, service_slug: r.slug }
}

export const BUNDLES: Bundle[] = [
  {
    id: 'exterior-repaint',
    name: 'Exterior repaint',
    ask: 'Wall area in m²',
    unit: 'm²',
    lines: (m2) => [
      line('High-pressure clean — exterior walls', m2, 'Prep: high-pressure clean exterior walls'),
      line('Exterior painting — 2 coats', m2),
    ],
  },
  {
    id: 'roof-restore',
    name: 'Roof restoration',
    ask: 'Roof area in m²',
    unit: 'm²',
    lines: (m2) => [line('Roof soft wash', m2, 'Prep: roof soft wash'), line('Roof painting', m2)],
  },
  {
    id: 'flat-roof-waterproof',
    name: 'Flat roof waterproofing',
    ask: 'Roof area in m²',
    unit: 'm²',
    lines: (m2) => [line('Roof soft wash', m2, 'Prep: clean roof surface'), line('Acrylic / liquid membrane waterproofing', m2)],
  },
  {
    id: 'torch-on',
    name: 'Torch-on waterproofing',
    ask: 'Roof area in m²',
    unit: 'm²',
    lines: (m2) => [line('Roof soft wash', m2, 'Prep: clean roof surface'), line('Torch-on waterproofing — single layer', m2)],
  },
  {
    id: 'interior-repaint',
    name: 'Interior repaint (walls + ceilings)',
    ask: 'Floor area in m²',
    unit: 'm²',
    // Rough guide: walls ≈ 2.5 × floor area, ceilings ≈ floor area. Adjust on the lines.
    lines: (m2) => [line('Interior painting — 2 coats', Math.round(m2 * 2.5)), line('Ceilings — 2 coats', m2)],
  },
  {
    id: 'solar-gutters',
    name: 'Solar clean + gutters',
    ask: 'Number of panels',
    unit: 'panels',
    lines: (n) => {
      const p = solarPrice(n)
      return [
        { description: `Solar panel cleaning — ${n} panels (gentle soft wash)`, quantity: p.quantity, unit: p.unit, unit_price: p.price, service_slug: 'solar-panel-cleaning' },
        line('Gutter cleaning', 1),
      ]
    },
  },
  {
    id: 'pre-sale',
    name: 'Pre-sale kerb appeal',
    ask: 'Driveway area in m²',
    unit: 'm²',
    lines: (m2) => [line('Full exterior wash package', 1), line('High-pressure clean — driveway / paving', m2), line('Gutter cleaning', 1)],
  },
]
