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
              Real Jobs, Real Proof
              <span className="block text-orange text-xl md:text-2xl mt-2">Helderberg &amp; Overberg Area</span>
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
              <Link href="/portfolio" className="text-blue font-bold hover:underline">
                View all projects &rarr;
              </Link>
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="kicker">Reviews</p>
          <h2 className="text-3xl md:text-4xl">What Our Clients Say</h2>
          <TestimonialCarousel />
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
      className="relative h-[190px] select-none cursor-ew-resize touch-none"
      onPointerDown={(e) => {
        draggingRef.current = true;
        updateFromClientX(e.clientX);
      }}
    >
      <div className="absolute inset-0">
        <Image src={after} alt="After" fill className="object-cover pointer-events-none" />
        <span className="absolute top-1.5 right-1.5 bg-orange/90 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
          After
        </span>
      </div>

      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt="Before" fill className="object-cover pointer-events-none" />
        <span className="absolute top-1.5 left-1.5 bg-jet/80 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
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

// Auto-rotating testimonial carousel — advances every 5s, pauses on
// hover/focus so people can actually read one before it moves on.
function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setActive((v) => (v + 1) % REVIEWS.length);
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="max-w-2xl mx-auto mt-8"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div className="card min-h-[180px] flex flex-col justify-center relative overflow-hidden">
        {REVIEWS.map((r, i) => (
          <div
            key={r.name}
            className={`transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0 absolute inset-0 p-5 pointer-events-none"}`}
            aria-hidden={i !== active}
          >
            <p className="text-orange">★★★★★</p>
            <p className="my-3 text-graphite">&ldquo;{r.quote}&rdquo;</p>
            <strong className="text-graphite">{r.name}</strong>
            <p className="text-mist text-xs">{r.source}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        {REVIEWS.map((r, i) => (
          <button
            key={r.name}
            type="button"
            aria-label={`Show review from ${r.name}`}
            onClick={() => setActive(i)}
            className={`relative h-2 rounded-full transition-all after:absolute after:-inset-3 after:content-[''] ${i === active ? "w-6 bg-orange" : "w-2 bg-slate/40 hover:bg-slate"}`}
          />
        ))}
      </div>
    </div>
  );
}
