import { RATE_CARD, solarPrice } from '@/lib/rate-card'

const zar = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA').replace(/,/g, ' ')

/**
 * Indicative "from" estimate (ex VAT) for the quote form. Always a guide — the
 * firm quote follows after we see the job / photos.
 */
export function instantEstimate(serviceSlug: string | undefined, sizeText: string): string | null {
  if (!serviceSlug) return null
  const n = parseFloat((sizeText.match(/(\d+(?:[.,]\d+)?)/)?.[1] ?? '').replace(',', '.'))
  if (serviceSlug === 'solar-panel-cleaning') {
    if (!n || n < 1) return 'Solar panel cleaning from R550 (up to 10 panels). Tell us the panel count for an exact guide.'
    const p = solarPrice(Math.round(n))
    const total = p.price * p.quantity
    return `Estimated ${zar(total)} excl. VAT for about ${Math.round(n)} panels.`
  }
  const group = RATE_CARD.find((g) => g.slug === serviceSlug)
  if (!group) return null
  const perUnit = group.items.filter((i) => i.unit === 'm²' || i.unit === 'm')
  if (perUnit.length && n > 0) {
    const low = Math.min(...perUnit.map((i) => i.price)) * n
    const high = Math.max(...perUnit.map((i) => i.price)) * n
    return low === high
      ? `Indicative ${zar(low)} excl. VAT for about ${n} ${perUnit[0].unit}.`
      : `Indicative ${zar(low)} – ${zar(high)} excl. VAT for about ${n} ${perUnit[0].unit}, depending on method.`
  }
  const min = Math.min(...group.items.map((i) => i.price))
  const unit = group.items.find((i) => i.price === min)?.unit
  return `${group.group} from ${zar(min)} per ${unit} excl. VAT. Photos and size help us give a firm price.`
}
