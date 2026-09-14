'use client'

import { useState } from 'react'
import { Sun, LayoutGrid, Paintbrush, Waves } from 'lucide-react'

type Calc = 'solar' | 'paving' | 'painting' | 'pool'

const rand = (n: number) =>
  'R' + Math.round(n).toLocaleString('en-ZA').replace(/,/g, ' ')

const inputCls =
  'w-full bg-jet border border-gray-700 rounded-lg px-3 py-2 text-sm text-white'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-gray-400 mb-1">{label}</span>
      {children}
    </label>
  )
}

function Result({
  lines,
  note,
}: {
  lines: { label: string; value: string; big?: boolean }[]
  note?: string
}) {
  return (
    <div className="border-2 border-orange rounded-xl bg-graphite p-4 mt-4">
      {lines.map((l) => (
        <div
          key={l.label}
          className="flex justify-between items-baseline py-1 border-b border-gray-800 last:border-0"
        >
          <span className="text-sm text-gray-400">{l.label}</span>
          <span
            className={
              l.big ? 'text-2xl font-black text-orange' : 'text-sm font-semibold text-white'
            }
          >
            {l.value}
          </span>
        </div>
      ))}
      {note && <p className="text-xs text-gray-500 mt-3 leading-relaxed">{note}</p>}
    </div>
  )
}

// --- 1. Solar cleaning ROI -------------------------------------------------

function SolarRoi() {
  const [panels, setPanels] = useState(20)
  const [watts, setWatts] = useState(550)
  const [tariff, setTariff] = useState(3.2)
  const [loss, setLoss] = useState(5)

  // Cape Town gets roughly 5.2 peak sun hours/day on average across the year.
  const PEAK_SUN_HOURS = 5.2
  const kwp = (panels * watts) / 1000
  const annualKwh = kwp * PEAK_SUN_HOURS * 365 * 0.8 // 0.8 system derate
  const lostKwh = annualKwh * (loss / 100)
  const lostRand = lostKwh * tariff

  // Clean cost from the published tier table
  const cleanCost =
    panels <= 10 ? 550 : panels <= 20 ? 950 : panels <= 30 ? 1350 : panels <= 40 ? 1700 : panels * 50
  const twoCleans = cleanCost * 2
  const net = lostRand - twoCleans

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Number of panels">
          <input
            type="number"
            className={inputCls}
            value={panels}
            onChange={(e) => setPanels(Math.max(1, Number(e.target.value) || 0))}
          />
        </Row>
        <Row label="Panel size (watts)">
          <input
            type="number"
            className={inputCls}
            value={watts}
            onChange={(e) => setWatts(Math.max(1, Number(e.target.value) || 0))}
          />
        </Row>
        <Row label="Your electricity rate (R/kWh)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={tariff}
            onChange={(e) => setTariff(Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Estimated soiling loss (%)">
          <select
            className={inputCls}
            value={loss}
            onChange={(e) => setLoss(Number(e.target.value))}
          >
            <option value={3}>3% — inland, low dust</option>
            <option value={5}>5% — typical Helderberg</option>
            <option value={8}>8% — coastal salt / heavy dust</option>
            <option value={12}>12% — visibly dirty, never cleaned</option>
          </select>
        </Row>
      </div>

      <Result
        lines={[
          { label: 'System size', value: `${kwp.toFixed(1)} kWp` },
          { label: 'Estimated annual output', value: `${Math.round(annualKwh).toLocaleString('en-ZA')} kWh` },
          { label: 'Lost to dirty panels', value: `${Math.round(lostKwh).toLocaleString('en-ZA')} kWh` },
          { label: 'That costs you per year', value: rand(lostRand) },
          { label: 'Two cleans per year', value: rand(twoCleans) },
          {
            label: net > 0 ? 'You come out ahead by' : 'Net cost',
            value: rand(Math.abs(net)),
            big: true,
          },
        ]}
        note="Estimate only. Based on roughly 5.2 peak sun hours a day for the Helderberg, a standard 0.8 system derate, and your inputs above. Actual soiling depends on your roof pitch, how close you are to the coast, and when it last rained. We confirm real figures on site."
      />
    </div>
  )
}

// --- 2. Paving -------------------------------------------------------------

function Paving() {
  const [length, setLength] = useState(10)
  const [width, setWidth] = useState(4)
  const [outside, setOutside] = useState(false)

  const area = length * width
  const base = area * 280
  const callout = outside ? 350 : 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Length (m)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={length}
            onChange={(e) => setLength(Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Width (m)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) || 0)}
          />
        </Row>
      </div>
      <label className="flex items-center gap-2 mb-2 text-sm text-gray-400">
        <input
          type="checkbox"
          checked={outside}
          onChange={(e) => setOutside(e.target.checked)}
        />
        Outside Strand / Gordon&apos;s Bay / Somerset West
      </label>

      <Result
        lines={[
          { label: 'Area', value: `${area.toFixed(1)} m²` },
          { label: 'Supply + lay @ R280/m²', value: rand(base) },
          ...(callout ? [{ label: 'Callout', value: rand(callout) }] : []),
          { label: 'Estimated from', value: rand(base + callout), big: true },
        ]}
        note="Starting estimate excluding VAT, using standard paving stock from Builders Warehouse. Excavation depth, base prep, edge restraints, levels and paver choice all affect the final price — confirmed after a free site visit."
      />
    </div>
  )
}

// --- 3. Painting -----------------------------------------------------------

function Painting() {
  const [wallArea, setWallArea] = useState(150)
  const [type, setType] = useState<'interior' | 'exterior'>('interior')
  const [ceilings, setCeilings] = useState(0)
  const [roof, setRoof] = useState(0)

  // Mid-point of each published range
  const wallRate = type === 'interior' ? 92.5 : 107.5
  const wallLow = type === 'interior' ? 75 : 85
  const wallHigh = type === 'interior' ? 110 : 130

  const low = wallArea * wallLow + ceilings * 65 + roof * 55
  const high = wallArea * wallHigh + ceilings * 95 + roof * 95
  const mid = wallArea * wallRate + ceilings * 80 + roof * 75

  const belowMin = type === 'interior' && wallArea < 120

  return (
    <div>
      <Row label="Type">
        <select
          className={inputCls}
          value={type}
          onChange={(e) => setType(e.target.value as 'interior' | 'exterior')}
        >
          <option value="interior">Interior walls (2 coats)</option>
          <option value="exterior">Exterior walls (2 coats)</option>
        </select>
      </Row>
      <Row label="Wall area (m²)">
        <input
          type="number"
          className={inputCls}
          value={wallArea}
          onChange={(e) => setWallArea(Number(e.target.value) || 0)}
        />
      </Row>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Ceilings (m², optional)">
          <input
            type="number"
            className={inputCls}
            value={ceilings}
            onChange={(e) => setCeilings(Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Roof (m², optional)">
          <input
            type="number"
            className={inputCls}
            value={roof}
            onChange={(e) => setRoof(Number(e.target.value) || 0)}
          />
        </Row>
      </div>

      <Result
        lines={[
          { label: 'Range', value: `${rand(low)} – ${rand(high)}` },
          { label: 'Typical', value: rand(mid), big: true },
        ]}
        note={
          (belowMin
            ? 'Note: our minimum interior job is 120 m² — smaller jobs are quoted individually. '
            : '') +
          'Excludes VAT. Includes labour and standard mid-range acrylic. Surface condition drives the price: crack repair, old paint stripping, damp treatment and coastal-grade coatings are quoted separately after a site visit.'
        }
      />
    </div>
  )
}

// --- 4. Pool fibre lining --------------------------------------------------

function Pool() {
  const [length, setLength] = useState(8)
  const [width, setWidth] = useState(4)
  const [depth, setDepth] = useState(1.5)

  // Wetted area: floor + four walls, +20% for curves, steps and shaping
  const area = (length * width + 2 * length * depth + 2 * width * depth) * 1.2
  const cost = area * 450

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <Row label="Length (m)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={length}
            onChange={(e) => setLength(Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Width (m)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) || 0)}
          />
        </Row>
        <Row label="Avg depth (m)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value) || 0)}
          />
        </Row>
      </div>

      <Result
        lines={[
          { label: 'Wetted surface area', value: `${area.toFixed(1)} m²` },
          { label: 'Fibre lining @ R450/m²', value: rand(cost), big: true },
        ]}
        note="Excludes VAT. Surface area includes a 20% allowance for steps, curves and shaping. Includes surface prep. Existing shell condition, structural cracks and drainage all affect the final quote — confirmed on site."
      />
    </div>
  )
}

// --- Wrapper ---------------------------------------------------------------

const tabs: { key: Calc; label: string; Icon: typeof Sun }[] = [
  { key: 'solar', label: 'Solar ROI', Icon: Sun },
  { key: 'paving', label: 'Paving', Icon: LayoutGrid },
  { key: 'painting', label: 'Painting', Icon: Paintbrush },
  { key: 'pool', label: 'Pool lining', Icon: Waves },
]

export default function Calculators({ initial = 'solar' }: { initial?: Calc }) {
  const [tab, setTab] = useState<Calc>(initial)

  return (
    <section className="max-w-2xl mx-auto px-4 py-10">
      <p className="text-orange font-semibold text-sm uppercase tracking-wide mb-2">
        Work it out yourself
      </p>
      <h2 className="text-2xl sm:text-3xl font-black mb-6">Instant estimate</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition ${
              tab === key
                ? 'bg-orange border-orange text-white'
                : 'border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'solar' && <SolarRoi />}
      {tab === 'paving' && <Paving />}
      {tab === 'painting' && <Painting />}
      {tab === 'pool' && <Pool />}

      <div className="mt-6 flex gap-3 flex-wrap">
        <a
          href="/quote"
          className="bg-orange hover:bg-orange-dark text-white font-semibold px-6 py-3 rounded-full text-sm"
        >
          Get an exact quote
        </a>
        <a
          href="https://wa.me/27631387945"
          className="bg-eco text-white font-semibold px-6 py-3 rounded-full text-sm"
        >
          WhatsApp us
        </a>
      </div>
    </section>
  )
}
