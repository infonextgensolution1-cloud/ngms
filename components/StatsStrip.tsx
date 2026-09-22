"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  value: number | null; // null = not filled in yet, so the card stays hidden
  suffix: string;
  label: string;
};

// PROOF NUMBERS — only put in numbers you can back up.
// Fill in the nulls (e.g. value: 1200) and the card appears automatically.
// The strip hides itself completely until at least 3 cards have real numbers.
const STATS: Stat[] = [
  { value: null, suffix: "+", label: "Solar Panels Cleaned" },
  { value: null, suffix: "+", label: "Jobs Completed" },
  { value: null, suffix: "+", label: "Years In The Trades" },
  { value: 12, suffix: "", label: "Trades, One Team" },
];

const MIN_STATS_TO_SHOW = 3;

// Animated count-up stat strip. The server-rendered HTML always carries the
// real numbers (so Google, link previews and slow connections never see "0").
// Once JS loads, if the strip is still below the fold, the numbers reset to 0
// out of sight and count up when scrolled into view.
export default function StatsStrip() {
  const stats = STATS.filter((s): s is Stat & { value: number } => s.value !== null);
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (reduceMotion || alreadyVisible) return; // keep the real numbers, no animation
    setArmed(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (stats.length < MIN_STATS_TO_SHOW) return null;

  return (
    <section ref={ref} className="bg-graphite text-white py-12 sm:py-14 border-y border-darkgrey">
      <div className="wrap grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} armed={armed} started={started} delayMs={i * 120} />
        ))}
      </div>
    </section>
  );
}

function StatCard({
  stat,
  armed,
  started,
  delayMs,
}: {
  stat: Stat & { value: number };
  armed: boolean;
  started: boolean;
  delayMs: number;
}) {
  const [display, setDisplay] = useState(stat.value);

  useEffect(() => {
    if (armed && !started) setDisplay(0);
  }, [armed, started]);

  useEffect(() => {
    if (!armed || !started) return;
    let raf: number;
    const duration = 1200;
    const startTime = performance.now() + delayMs;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round(stat.value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, started, stat.value, delayMs]);

  return (
    <div className="card text-center hover:border-orange/50 transition-colors">
      <p className="font-heading text-3xl sm:text-4xl font-bold text-orange tabular-nums">
        {display.toLocaleString("en-ZA")}
        {stat.suffix}
      </p>
      <p className="tag mt-1">{stat.label}</p>
    </div>
  );
}
