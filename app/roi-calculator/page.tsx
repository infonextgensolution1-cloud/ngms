'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

function cleaningCost(panels: number): number {
  if (panels <= 10) return 550
  if (panels <= 20) return 950
  if (panels <= 30) return 1350
  if (panels <= 40) return 1700
  return panels * 50
}

export default function RoiCalculatorPage() {
  const [panels, setPanels] = useState(20)
  const [monthlyBill, setMonthlyBill] = useState(1800)

  const result = useMemo(() => {
    const lossPct = 0.1 // conservative mid-point estimate for coastal dust/pollen soiling
    const monthlyLoss = monthlyBill * lossPct
    const annualLoss = monthlyLoss * 12
    const cost = cleaningCost(panels)
    const cleaningsPerYear = 2.5 // every 4-6 months
    const annualCleaningCost = cost * cleaningsPerYear
    const netAnnualBenefit = annualLoss - annualCleaningCost
    const weeksToPayback = monthlyLoss > 0 ? Math.round((cost / monthlyLoss) * 4.33) : 0
    return { monthlyLoss, annualLoss, cost, annualCleaningCost, netAnnualBenefit, weeksToPayback }
  }, [panels, monthlyBill])

  const inputClass = 'w-full bg-cardgrey border border-darkgrey text-paper rounded-btn px-4 py-3'

  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Solar Panel Cleaning</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">ROI Calculator</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Estimate how much dirty panels could be costing you — and what regular cleaning gets back.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-2xl mx-auto px-4 grid sm:grid-cols-2 gap-6 mb-10">
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Number of panels</label>
            <input
              type="number"
              min={1}
              value={panels}
              onChange={(e) => setPanels(Math.max(1, Number(e.target.value)))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Average monthly electricity saving from solar (R)</label>
            <input
              type="number"
              min={0}
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(Math.max(0, Number(e.target.value)))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-cardgrey border border-darkgrey rounded-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-mist">Estimated output lost to dust &amp; grime (10%)</span>
              <span className="text-orange font-bold font-heading">R{Math.round(result.monthlyLoss)}/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-mist">Estimated annual loss if left dirty</span>
              <span className="text-orange font-bold font-heading">R{Math.round(result.annualLoss)}/year</span>
            </div>
            <div className="h-px bg-darkgrey" />
            <div className="flex justify-between items-center">
              <span className="text-mist">Cost per clean ({panels} panels)</span>
              <span className="text-paper font-bold font-heading">R{result.cost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-mist">Annual cost on our recommended plan (every 4–6 months)</span>
              <span className="text-paper font-bold font-heading">R{Math.round(result.annualCleaningCost)}</span>
            </div>
            <div className="h-px bg-darkgrey" />
            <div className="flex justify-between items-center">
              <span className="text-paper font-heading font-semibold">Estimated net annual benefit</span>
              <span className={`font-heading font-bold text-lg ${result.netAnnualBenefit >= 0 ? 'text-whatsapp' : 'text-orange'}`}>
                R{Math.round(result.netAnnualBenefit)}
              </span>
            </div>
            {result.weeksToPayback > 0 && (
              <p className="text-mist text-sm">
                A single clean typically pays for itself in about {result.weeksToPayback} weeks of restored output.
              </p>
            )}
          </div>

          <p className="text-mist text-xs opacity-70 mt-4">
            This is an estimate for illustration only. Actual soiling loss varies by season, location, roof angle
            and time since last clean — typical published ranges run 5–15% in dusty coastal areas. Cleaning costs
            based on our standard{' '}
            <Link href="/price-list" className="text-blue">price list</Link>.
          </p>
        </div>
      </section>

      <section className="bg-jet text-white text-center py-14 px-4">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Ready to stop losing power to dirty panels?</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <Link href="/quote" className="bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            Get a Free Quote
          </Link>
          <Link href="/maintenance-packages" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-orange hover:text-orange">
            View Maintenance Packages
          </Link>
        </div>
      </section>
    </main>
  )
}
