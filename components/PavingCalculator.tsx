"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const FROM_PRICE_PER_M2 = 280; // matches services.ts paving pricingNotes

export default function PavingCalculator() {
  const [length, setLength] = useState(6);
  const [width, setWidth] = useState(4);

  const area = useMemo(() => Math.round(length * width), [length, width]);
  const estimate = useMemo(() => area * FROM_PRICE_PER_M2, [area]);

  const quoteHref = `/quote?service=${encodeURIComponent("Paving")}&size=${encodeURIComponent(`${length}m x ${width}m (~${area}m²)`)}`;

  return (
    <div className="card text-left">
      <p className="tag">Paving estimate</p>
      <h3 className="text-lg mt-1">Ballpark your driveway or patio</h3>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <NumberField label="Length (m)" value={length} onChange={setLength} min={1} max={60} />
        <NumberField label="Width (m)" value={width} onChange={setWidth} min={1} max={30} />
      </div>

      <div className="mt-5 rounded-lg border border-orange/40 bg-orange/10 p-4 text-center">
        <p className="text-mist text-xs uppercase tracking-wider">Approx. area</p>
        <p className="text-3xl font-display text-orange mt-1">{area}m²</p>
        <p className="text-mist text-sm mt-2">
          From <strong className="text-paper">R{estimate.toLocaleString("en-ZA")}</strong> at R{FROM_PRICE_PER_M2}/m²
        </p>
      </div>

      <p className="text-mist text-[11px] mt-3">
        "From" pricing on new interlocking paving over a compacted base. Final price depends on base condition,
        access and paver choice — confirmed on a free site visit.
      </p>

      <Link href={quoteHref} className="btn btn-wa mt-4 w-full text-center">
        Get an exact quote for {area}m²
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
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label>
      <span className="flex justify-between text-mist text-sm font-semibold mb-1.5">
        <span>{label}</span>
        <span className="text-paper">{value}m</span>
      </span>
      <input
        type="range"
        className="w-full accent-orange"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
