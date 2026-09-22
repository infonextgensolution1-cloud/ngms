"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// Simple, honest rule-of-thumb estimator: soiling loss builds roughly
// ~2%/month since the last clean, capped at 25% (matches the "up to 25%"
// figure already used in the solar panel cleaning copy). Not a precise
// engineering model — it's a lead magnet, framed as an estimate throughout.
function estimateLossPct(monthsSinceClean: number) {
  return Math.min(25, Math.round(monthsSinceClean * 2));
}

export default function SolarRoiCalculator() {
  const [panels, setPanels] = useState(15);
  const [months, setMonths] = useState(8);
  const [bill, setBill] = useState(2200);

  const lossPct = useMemo(() => estimateLossPct(months), [months]);
  const monthlyRecovery = useMemo(() => Math.round((bill * lossPct) / 100), [bill, lossPct]);

  const quoteHref = `/quote?service=${encodeURIComponent("Solar Panel Cleaning")}&size=${encodeURIComponent(`${panels} panels`)}`;

  return (
    <div className="card text-left">
      <p className="tag">Solar ROI estimate</p>
      <h3 className="text-lg mt-1">What's dirty panels costing you?</h3>

      <div className="grid gap-3 mt-4">
        <NumberField label="Number of panels" value={panels} onChange={setPanels} min={1} max={200} />
        <NumberField label="Months since last clean" value={months} onChange={setMonths} min={0} max={24} />
        <NumberField label="Average monthly electricity bill (R)" value={bill} onChange={setBill} min={0} max={20000} step={100} />
      </div>

      <div className="mt-5 rounded-lg border border-orange/40 bg-orange/10 p-4 text-center">
        <p className="text-mist text-xs uppercase tracking-wider">Estimated output loss</p>
        <p className="text-3xl font-display text-orange mt-1">{lossPct}%</p>
        {bill > 0 && (
          <p className="text-mist text-sm mt-2">
            That's roughly <strong className="text-paper">R{monthlyRecovery.toLocaleString("en-ZA")}/month</strong> you
            could be recovering with a clean.
          </p>
        )}
      </div>

      <p className="text-mist text-[11px] mt-3">
        Rule-of-thumb estimate based on typical Helderberg soiling rates, not a measured reading. Your real number
        depends on panel angle, dust and pollen.
      </p>

      <Link href={quoteHref} className="btn btn-wa mt-4 w-full text-center">
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
