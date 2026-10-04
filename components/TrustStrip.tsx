"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BeforeAfter } from "@/lib/queries";

// Real reviews only. Add new Google reviews to the TOP of this list,
// e.g. { quote: "...", name: "Trustee, Cosmos Mews", source: "Google Review — 5 stars" },
const REVIEWS = [
  {
    quote: "Reasonable price. Professional cleaning on 3 of my commercial buildings.",
    name: "Alewyn Bronn",
    source: "Google Review — 5 stars",
  },
  {
    quote: "Impressive guys, a job well done!",
    name: "Marlene Bronn",
    source: "Facebook",
  },
  {
    quote: "Fantastic service, great communication! No hidden costs — did really great work at heights I avoid.",
    name: "Cornellskop Animal Encounters",
    source: "Facebook",
  },
];

// Before/after photos + real reviews, surfaced right under the hero —
// the biggest trust lever for property maintenance, where people are
// wary of who they let on the roof or in the pool area.
export default function TrustStrip({ beforeAfter }: { beforeAfter: BeforeAfter[] }) {
  const pairs = beforeAfter.slice(0, 3);

  return (
    <section className="band-light py-14 px-4 bg-fog border-y border-concrete">
      <div className="wrap">
        {pairs.length > 0 && (
          <div className="text-center mb-14">
            <p className="kicker">Drag to compare</p>
            <h2 className="text-3xl md:text-4xl">
              Real jobs, real proof
              <span className="block text-orange text-xl md:text-2xl mt-2">Helderberg &amp; Overberg</span>
            </h2>
            <div
              className={`grid gap-5 mt-8 ${pairs.length === 1 ? "max-w-[420px] mx-auto" : "sm:grid-cols-2 md:grid-cols-3"}`}
            >
              {pairs.map((item, idx) => (
                <div key={idx} className="card !p-0 overflow-hidden text-left">
                  <BeforeAfterSlider before={item.before_image_url} after={item.after_image_url} />
                  <div className="p-3">
                    <p className="text-sm">{item.caption || item.location}</p>
                    <p className="tag">{item.location}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6">
              <Link href="/portfolio" className="text-blue font-semibold hover:underline">
                View all projects &rarr;
              </Link>
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="kicker">Reviews</p>
          <h2 className="text-3xl md:text-4xl">What clients say</h2>
          <Reviews />
        </div>
      </div>
    </section>
  );
}

// Draggable / tappable before-after comparison. Pure client-side CSS
// clip-path, no libraries — works with mouse drag, touch drag and a
// click-anywhere jump.
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Before and after comparison. Use the arrow keys to reveal more of the before or after photo."
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      aria-valuetext={`${Math.round(pos)}% before photo showing`}
      className="relative h-[220px] select-none cursor-ew-resize touch-pan-y"
      onPointerDown={(e) => {
        draggingRef.current = true;
        updateFromClientX(e.clientX);
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 25 : 5;
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPos((p) => Math.max(0, p - step));
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") setPos((p) => Math.min(100, p + step));
        else if (e.key === "Home") setPos(0);
        else if (e.key === "End") setPos(100);
        else return;
        e.preventDefault();
      }}
    >
      <div className="absolute inset-0">
        <Image src={after} alt="After" fill sizes="(max-width: 640px) 100vw, 400px" quality={70} className="object-cover pointer-events-none" />
        <span className="absolute top-2 right-2 bg-blue-fill text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
          After
        </span>
      </div>

      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt="Before" fill sizes="(max-width: 640px) 100vw, 400px" quality={70} className="object-cover pointer-events-none" />
        <span className="absolute top-2 left-2 bg-jet/85 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
          Before
        </span>
      </div>

      <div className="absolute top-0 bottom-0 w-0.5 bg-paper/90 pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 h-8 w-8 rounded-full bg-paper flex items-center justify-center shadow-lg">
          <span className="text-jet text-xs">&#8596;</span>
        </div>
      </div>
    </div>
  );
}

// All reviews at once — only three, so no carousel. Stars only where the
// source is actually a star rating (Facebook recommendations are not).
function Reviews() {
  return (
    <ul className="grid gap-4 md:grid-cols-3 mt-8 text-left">
      {REVIEWS.map((r) => (
        <li key={r.name} className="card flex flex-col">
          {/5 stars/i.test(r.source) && (
            <p className="text-orange tracking-[0.2em]" aria-label="Rated 5 out of 5">
              ★★★★★
            </p>
          )}
          <blockquote className="my-3 text-graphite flex-1">&ldquo;{r.quote}&rdquo;</blockquote>
          <p className="font-semibold text-graphite">{r.name}</p>
          <p className="text-mist text-xs">{r.source}</p>
        </li>
      ))}
    </ul>
  );
}
