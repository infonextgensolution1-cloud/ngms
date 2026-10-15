"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { groupThousands } from "@/lib/solar-pricing";

// Solar soiling estimator — a transparent rule of thumb, not a measurement.
//
// What dirt costs you is a share of what your panels PRODUCE (not of your
// Eskom/municipal bill), so the maths is:
//   system size (kW)      = panels × panel rating (W) ÷ 1000
//   monthly production    = kW × daily yield (kWh per kW) × 30
//   monthly value         = production × your tariff (R/kWh)
//   estimated loss        = value × soiling %  (1.25% per month since the last
//                           clean, capped at 10%)
// Every assumption is shown under the result and the main ones are editable.
const SOILING_PER_MONTH = 1.25;
const MAX_LOSS_PCT = 10;
const DAILY_YIELD_KWH_PER_KW = 4.2; // approximate Western Cape year-round average
const DAYS_PER_MONTH = 30;

function estimateLossPct(monthsSinceClean: number) {
  return Math.min(MAX_LOSS_PCT, Math.round(monthsSinceClean * SOILING_PER_MONTH * 10) / 10);
}

const GAUGE_RADIUS = 52;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

const rand = (n: number) => `R${groupThousands(n)}`;

export default function SolarRoiCalculator() {
  const [panels, setPanels] = useState(15);
  const [months, setMonths] = useState(8);
  const [panelWatts, setPanelWatts] = useState(450);
  const [tariff, setTariff] = useState(3.5);

  const r = useMemo(() => {
    const kw = (panels * panelWatts) / 1000;
    const kwhMonth = kw * DAILY_YIELD_KWH_PER_KW * DAYS_PER_MONTH;
    const valueMonth = kwhMonth * tariff;
    const lossPct = estimateLossPct(months);
    return { kw, kwhMonth, valueMonth, lossPct, lossKwh: (kwhMonth * lossPct) / 100, lossRand: (valueMonth * lossPct) / 100 };
  }, [panels, panelWatts, tariff, months]);

  const quoteHref = `/quote?service=${encodeURIComponent("Solar Panel Cleaning")}&size=${encodeURIComponent(`${panels} panels`)}`;
  const dashOffset = GAUGE_CIRCUMFERENCE * (1 - Math.min(1, r.lossPct / MAX_LOSS_PCT));

  return (
    <div className="panel p-5 sm:p-6 text-left">
      <p className="tag">Solar soiling estimate</p>
      <h3 className="text-lg mt-1">What could dirty panels be costing you?</h3>

      <div className="grid gap-3 mt-4">
        <RangeField label="Number of panels" value={panels} display={`${panels}`} onChange={setPanels} min={1} max={200} />
        <RangeField label="Months since last clean" value={months} display={`${months}`} onChange={setMonths} min={0} max={24} />
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Panel rating (W)" value={panelWatts} onChange={setPanelWatts} min={100} max={800} step={5} />
          <NumberInput label="Your tariff (R/kWh)" value={tariff} onChange={setTariff} min={0.5} max={10} step={0.05} />
        </div>
      </div>

      <div className="mt-5 rounded-panel border border-blue/30 bg-blue/10 p-4 flex items-center gap-4" aria-live="polite">
        <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0 -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={GAUGE_RADIUS} fill="none" stroke="#2E3035" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={GAUGE_RADIUS}
            fill="none"
            stroke="#3B8BFF"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
          <text x="60" y="68" textAnchor="middle" fill="#F4F4F2" fontSize="26" fontWeight="700" className="rotate-90 origin-center">
            {r.lossPct}%
          </text>
        </svg>
        <div>
          <p className="text-mist text-xs uppercase tracking-wider">Estimated soiling loss</p>
          <p className="text-paper text-xl font-heading font-semibold mt-1">≈ {rand(r.lossRand)}/month</p>
          <p className="text-mist text-sm mt-0.5">
            about {groupThousands(r.lossKwh)} kWh of {groupThousands(r.kwhMonth)} kWh produced
          </p>
        </div>
      </div>

      <details className="mt-3 text-xs text-mist group">
        <summary className="cursor-pointer select-none py-2 font-semibold text-paper/90 hover:text-blue">
          How this is worked out
        </summary>
        <ul className="space-y-1 pb-1 list-disc pl-4">
          <li>
            System size: {panels} × {panelWatts} W = {r.kw.toFixed(1)} kW.
          </li>
          <li>
            Production: {DAILY_YIELD_KWH_PER_KW} kWh per kW per day (approximate Western Cape yearly average) × {DAYS_PER_MONTH} days ≈{" "}
            {groupThousands(r.kwhMonth)} kWh/month, worth {rand(r.valueMonth)} at R{tariff.toFixed(2)}/kWh.
          </li>
          <li>
            Soiling: {SOILING_PER_MONTH}% per month since the last clean, capped at {MAX_LOSS_PCT}% — a rule of thumb, not a
            measurement. Real losses depend on tilt, rain, dust, pollen, salt spray and birds.
          </li>
          <li>Only counts energy you would otherwise use or be credited for. Check your tariff on your municipal or Eskom bill.</li>
        </ul>
      </details>

      <Link href={quoteHref} className="btn-quote mt-4 w-full text-center">
        Get an exact quote for {panels} panels
      </Link>
    </div>
  );
}

function RangeField({
  label,
  value,
  display,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  display: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label>
      <span className="flex justify-between text-mist text-sm font-semibold mb-1.5">
        <span>{label}</span>
        <span className="text-paper">{display}</span>
      </span>
      <input
        type="range"
        className="w-full accent-[#3B8BFF]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="min-w-0">
      <span className="block text-mist text-sm font-semibold mb-1.5">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        className="field"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(0, n)));
        }}
      />
    </label>
  );
}
