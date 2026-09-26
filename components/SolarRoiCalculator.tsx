"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// Simple, honest rule-of-thumb estimator: soiling loss builds roughly
// ~1.25%/month since the last clean, capped at 10% (matches the "up to 10%"
// figure used in the homepage hero and ROI page). Not a precise
// engineering model — it's a lead magnet, framed as an estimate throughout.
const MAX_LOSS_PCT = 10;
function estimateLossPct(monthsSinceClean: number) {
  return Math.min(MAX_LOSS_PCT, Math.round(monthsSinceClean * 1.25));
}

const GAUGE_RADIUS = 52;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const GAUGE_MAX_PCT = MAX_LOSS_PCT; // matches the estimator's cap, so the ring can reach full

export default function SolarRoiCalculator() {
  const [panels, setPanels] = useState(15);
  const [months, setMonths] = useState(8);
  const [bill, setBill] = useState(2200);

  const lossPct = useMemo(() => estimateLossPct(months), [months]);
  const monthlyRecovery = useMemo(() => Math.round((bill * lossPct) / 100), [bill, lossPct]);

  const quoteHref = `/quote?service=${encodeURIComponent("Solar Panel Cleaning")}&size=${encodeURIComponent(`${panels} panels`)}`;

  const gaugeFraction = Math.min(1, lossPct / GAUGE_MAX_PCT);
  const dashOffset = GAUGE_CIRCUMFERENCE * (1 - gaugeFraction);

  return (
    <div className="card text-left">
      <p className="tag">Solar ROI estimate</p>
      <h3 className="text-lg mt-1">What are dirty panels costing you?</h3>

      <div className="grid gap-3 mt-4">
        <NumberField label="Number of panels" value={panels} onChange={setPanels} min={1} max={200} />
        <NumberField label="Months since last clean" value={months} onChange={setMonths} min={0} max={24} />
        <NumberField
          label="Average monthly electricity bill (R)"
          value={bill}
          onChange={setBill}
          min={0}
          max={20000}
          step={100}
        />
      </div>

      <div className="mt-5 rounded-lg border border-orange/40 bg-orange/10 p-4 flex items-center gap-4">
        <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0 -rotate-90">
          <circle cx="60" cy="60" r={GAUGE_RADIUS} fill="none" stroke="#1B2027" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={GAUGE_RADIUS}
            fill="none"
            stroke="#FF7A18"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
          <text
            x="60"
            y="66"
            textAnchor="middle"
            fill="#F7F9FB"
            fontSize="28"
            fontWeight="700"
            className="rotate-90 origin-center"
            style={{ fontFamily: "var(--font-oswald), sans-serif" }}
          >
            {lossPct}%
          </text>
        </svg>
        <div>
          <p className="text-mist text-xs uppercase tracking-wider">Estimated output loss</p>
          {bill > 0 && (
            <p className="text-mist text-sm mt-1">
              That&apos;s roughly{" "}
              <strong className="text-paper">R{monthlyRecovery.toLocaleString("en-ZA")}/month</strong> you could be
              recovering with a clean.
            </p>
          )}
        </div>
      </div>

      <p className="text-mist text-[11px] mt-3">
        Rule-of-thumb estimate based on typical Helderberg soiling rates, not a measured reading. Your real number
        depends on panel angle, dust and pollen.
      </p>

      <Link href={quoteHref} className="btn-quote mt-4 w-full text-center">
        Get an exact quote for {panels} panels
      </Link>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label>
      <span className="flex justify-between text-mist text-sm font-semibold mb-1.5">
        <span>{label}</span>
        <span className="text-paper">{value}</span>
      </span>
      <input
        type="range"
        className="w-full accent-orange"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
