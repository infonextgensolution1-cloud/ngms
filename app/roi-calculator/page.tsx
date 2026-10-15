'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { groupThousands, solarCleanFromPrice } from '@/lib/solar-pricing'

// Transparent break-even estimate. Every number used is an input or is printed on the page:
//   monthly loss  = monthly solar saving × assumed soiling %
//   break-even    = price of one clean ÷ monthly loss
export default function RoiCalculatorPage() {
  const [panels, setPanels] = useState(20)
  const [monthlySaving, setMonthlySaving] = useState(1800)
  const [soilingPct, setSoilingPct] = useState(5)

  const result = useMemo(() => {
    const monthlyLoss = (monthlySaving * soilingPct) / 100
    const cost = solarCleanFromPrice(panels)
    const monthsToBreakEven = monthlyLoss > 0 ? cost / monthlyLoss : null
    return { monthlyLoss, annualLoss: monthlyLoss * 12, cost, monthsToBreakEven }
  }, [panels, monthlySaving, soilingPct])

  const rand = (n: number) => `R${groupThousands(n)}`

  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="kicker">Solar panel cleaning</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">ROI calculator</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          A quick, honest estimate of what soiling could be costing you — with every assumption on the table.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-5xl mx-auto px-4 mb-8 grid sm:grid-cols-3 gap-3">
          {[["01","System size","How many panels are on the roof?"],["02","Your saving","What does solar save you each month?"],["03","Soiling","Use a conservative dirt-loss assumption."]].map(([n,t,d]) => <div key={n} className="rounded-card border border-darkgrey bg-cardgrey p-4"><p className="text-xs font-bold tracking-[0.18em] text-orange">{n}</p><p className="font-heading font-semibold text-paper mt-2">{t}</p><p className="text-xs text-mist mt-1 leading-relaxed">{d}</p></div>)}
        </div>
        <div className="max-w-2xl mx-auto px-4 grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="roi-panels" className="block text-sm font-semibold mb-1.5 text-paper">Number of panels</label>
            <input id="roi-panels" type="number" inputMode="numeric" min={1} max={500} value={panels}
              onChange={(e) => setPanels(Math.min(500, Math.max(1, Number(e.target.value) || 1)))} className="field" />
          </div>
          <div>
            <label htmlFor="roi-saving" className="block text-sm font-semibold mb-1.5 text-paper">Monthly saving from your solar (R)</label>
            <input id="roi-saving" type="number" inputMode="numeric" min={0} step={50} value={monthlySaving}
              onChange={(e) => setMonthlySaving(Math.max(0, Number(e.target.value) || 0))} className="field" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="roi-soiling" className="flex justify-between text-sm font-semibold mb-1.5 text-paper">
              <span>Assumed output lost to dirt</span>
              <span>{soilingPct}%</span>
            </label>
            <input id="roi-soiling" type="range" min={0} max={15} step={1} value={soilingPct}
              onChange={(e) => setSoilingPct(Number(e.target.value))} className="w-full accent-[#3B8BFF]" />
            <p className="text-mist text-xs mt-1">
              This is your assumption, not a measurement. It depends on how long since the last clean, tilt, rain, dust,
              pollen, salt spray and birds. Not sure? Compare your inverter app&rsquo;s output before and after a clean.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="panel p-6 space-y-4 shadow-2xl" aria-live="polite">
            <div className="flex items-center justify-between gap-4 border-b border-darkgrey pb-4"><div><p className="kicker">Your estimate</p><p className="text-sm text-mist">Transparent inputs. No inflated savings claim.</p></div><span className="rounded-full bg-orange/15 border border-orange/30 px-3 py-1 text-xs font-bold text-orange">LIVE</span></div>
            <Row label={`Estimated monthly loss (${soilingPct}% of ${rand(monthlySaving)})`} value={`${rand(result.monthlyLoss)}/month`} strong />
            <Row label="Same loss over a year" value={`${rand(result.annualLoss)}/year`} />
            <div className="h-px bg-darkgrey" />
            <Row label={`One clean, ${panels} panels (from, excl. VAT)`} value={rand(result.cost)} />
            <Row
              label="Break-even on one clean"
              value={result.monthsToBreakEven === null ? '—' : `≈ ${result.monthsToBreakEven.toFixed(1)} months`}
              strong
            />
          </div>

          <p className="text-mist text-xs mt-4">
            Illustration only. Cleaning prices are the starting prices on our{' '}
            <Link href="/price-list" className="text-blue underline">price list</Link>; your firm price follows once we
            know roof access and panel count.
          </p>
        </div>
      </section>

      <section className="bg-jet text-white text-center py-14 px-4 border-t border-darkgrey">
        <p className="kicker">Next step</p>
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Turn the estimate into a real quote.</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <Link href={`/quote?service=${encodeURIComponent('Solar Panel Cleaning')}&size=${encodeURIComponent(`${panels} panels`)}`} className="btn-quote">
            Get a free quote
          </Link>
          <Link href="/maintenance-packages" className="btn-outline">
            View maintenance plans
          </Link>
        </div>
      </section>
    </main>
  )
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-mist">{label}</span>
      <span className={`font-heading font-semibold text-right shrink-0 ${strong ? 'text-paper text-lg' : 'text-paper/80'}`}>{value}</span>
    </div>
  )
}
