'use client'

import { useEffect, useId, useRef, useState } from 'react'

// Illustrative soiling curve for a typical 5 kW Helderberg home system:
// ~24 kWh/day when clean, sliding towards ~21.6 kWh/day (-10%) as dust, salt
// and bird droppings build up, then jumping back after each clean.
const CURVE = [24, 23.2, 22.4, 21.6, 24, 23.2, 22.4, 21.7, 24, 23.3, 22.6, 21.9]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CLEANS = [4, 8]
const CLEAN_KWH = 24

const PURPLE = '#8B1BF5'
const ORANGE = '#F57C1B'
const INK = '#0A0A0A'
const MUTED = '#6B6D72'

const W = 340
const H = 190
const L = 30
const R = 12
const T = 22
const B = 26
const Y_MIN = 20.8
const Y_MAX = 24.6

const x = (i: number) => L + (i * (W - L - R)) / (CURVE.length - 1)
const y = (v: number) => T + ((Y_MAX - v) * (H - T - B)) / (Y_MAX - Y_MIN)

// Output line: slides down month to month, drops to its dirtiest just before a
// clean, then steps straight back up to the clean line.
function outputPoints() {
  const pts: [number, number][] = [[x(0), y(CURVE[0])]]
  for (let i = 1; i < CURVE.length; i++) {
    if (CLEANS.includes(i)) pts.push([x(i), y(CURVE[i - 1] - 0.4)])
    pts.push([x(i), y(CURVE[i])])
  }
  return pts
}

const PTS = outputPoints()
const LINE = PTS.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
const BASE_Y = y(CLEAN_KWH)
// Orange "lost output" wedge between the clean line and the actual output.
const LOST = `${LINE} L ${x(CURVE.length - 1)} ${BASE_Y} L ${x(0)} ${BASE_Y} Z`
// Soft purple fill under the output line.
const UNDER = `${LINE} L ${x(CURVE.length - 1)} ${H - B} L ${x(0)} ${H - B} Z`

const avgLossPct = Math.round((CURVE.reduce((a, v) => a + (CLEAN_KWH - v), 0) / CURVE.length / CLEAN_KWH) * 1000) / 10

export default function SoilingChart() {
  const uid = useId().replace(/:/g, '')
  const ref = useRef<SVGSVGElement>(null)
  const [shown, setShown] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  // Draw the line when the chart scrolls into view.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const tip = active !== null ? { i: active, v: CURVE[active] } : null
  const tipX = tip ? Math.min(Math.max(x(tip.i), L + 34), W - R - 34) : 0

  return (
    <div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full h-auto select-none soiling-chart ${shown ? 'is-shown' : ''}`}
        role="img"
        aria-label="Illustrative chart: solar output drops about 10%, from 24 to 21.6 kWh a day, as panels get dirty, and jumps back to 24 after each clean in May and September"
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={`line-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={PURPLE} />
            <stop offset="100%" stopColor="#B77BFA" />
          </linearGradient>
          <linearGradient id={`under-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={PURPLE} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`lost-${uid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={ORANGE} stopOpacity="0.15" />
            <stop offset="100%" stopColor={ORANGE} stopOpacity="0.55" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft grid */}
        {[21, 22, 23, 24].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={INK} strokeOpacity={0.06} />
            <text x={L - 7} y={y(t) + 3.5} textAnchor="end" fontSize="9" fill={MUTED}>
              {t}
            </text>
          </g>
        ))}

        {/* fills */}
        <path d={UNDER} fill={`url(#under-${uid})`} className="sc-fade" />
        <path d={LOST} fill={`url(#lost-${uid})`} className="sc-fade" />

        {/* clean baseline */}
        <line x1={L} x2={W - R} y1={BASE_Y} y2={BASE_Y} stroke={PURPLE} strokeOpacity={0.45} strokeDasharray="3 5" strokeLinecap="round" />
        <text x={W - R} y={BASE_Y - 6} textAnchor="end" fontSize="8.5" fontWeight="700" fill={PURPLE} letterSpacing="0.06em">
          CLEAN PANELS · 24 kWh
        </text>

        {/* output line */}
        <path
          d={LINE}
          fill="none"
          stroke={`url(#line-${uid})`}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#glow-${uid})`}
          pathLength={1}
          className="sc-draw"
        />

        {/* clean markers */}
        {CLEANS.map((i, n) => (
          <g key={i} className="sc-pop" style={{ animationDelay: `${0.9 + n * 0.25}s` }}>
            <circle cx={x(i)} cy={y(CURVE[i])} r="9" fill={PURPLE} opacity="0.18" className="sc-pulse" />
            <circle cx={x(i)} cy={y(CURVE[i])} r="5" fill="#fff" stroke={PURPLE} strokeWidth="2.5" />
            <rect x={x(i) - 20} y={y(CURVE[i - 1] - 0.4) + 8} width="40" height="15" rx="7.5" fill={INK} />
            <text x={x(i)} y={y(CURVE[i - 1] - 0.4) + 18.5} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" letterSpacing="0.06em">
              CLEAN
            </text>
          </g>
        ))}

        {/* months */}
        {MONTHS.map((m, i) => (
          <text
            key={m}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="9"
            fontWeight={active === i ? 700 : 400}
            fill={active === i ? INK : MUTED}
          >
            {m[0]}
          </text>
        ))}

        {/* hover / tap tooltip */}
        {tip && (
          <g pointerEvents="none">
            <line x1={x(tip.i)} x2={x(tip.i)} y1={T - 4} y2={H - B} stroke={INK} strokeOpacity={0.2} strokeDasharray="2 3" />
            <circle cx={x(tip.i)} cy={y(tip.v)} r="4" fill={PURPLE} stroke="#fff" strokeWidth="2" />
            <rect x={tipX - 34} y={2} width="68" height="18" rx="9" fill={INK} />
            <text x={tipX} y={14.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
              {MONTHS[tip.i]} · {tip.v.toFixed(1)} kWh
            </text>
          </g>
        )}

        {/* hit areas (one column per month) */}
        {MONTHS.map((m, i) => {
          const half = (W - L - R) / (CURVE.length - 1) / 2
          return (
            <rect
              key={`hit-${m}`}
              x={x(i) - half}
              y={0}
              width={half * 2}
              height={H}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive((a) => (a === i ? null : i))}
            />
          )
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#3A3C40]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full bg-power" aria-hidden /> Your output
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 rounded-sm bg-orange/60" aria-hidden /> Lost to dirt
        </span>
        <span className="ml-auto rounded-full bg-power/10 text-power-dark font-bold px-2.5 py-0.5">
          ~{avgLossPct}% avg · up to 10%
        </span>
      </div>
    </div>
  )
}
