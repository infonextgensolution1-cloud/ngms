import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

const POINTS = [
  "12 trades, one point of contact",
  "Free written quote before anything starts",
  "Local team — Strand, Gordon's Bay, Somerset West",
];

// Ember Grid signature element #4 — full-bleed orange split panel.
// Orange half carries the headline + proof list, dark half carries an
// abstract animated "solar grid" graphic (no stock photo needed).
export default function SplitCta() {
  return (
    <section className="grid md:grid-cols-2 overflow-hidden">
      <Reveal direction="left" className="bg-orange text-jet px-6 sm:px-12 py-16 md:py-20 flex flex-col justify-center">
        <p className="text-jet/70 text-xs tracking-[0.2em] uppercase font-bold mb-3 font-heading">
          One Call. All Solutions.
        </p>
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl leading-[1.05]">
          ONE TEAM FOR EVERY TRADE ON YOUR PROPERTY.
        </h2>
        <ul className="mt-6 space-y-2.5">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5 font-semibold">
              <span aria-hidden className="mt-1 text-jet">+</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 bg-jet text-white font-heading font-bold text-sm uppercase tracking-wide px-6 py-3 rounded-btn hover:-translate-y-0.5 hover:shadow-lg hover:shadow-jet/30 transition-all duration-200"
          >
            Get Free Quote
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </Reveal>

      <Reveal direction="right" delayMs={100} className="relative bg-jet min-h-[280px] md:min-h-0 overflow-hidden">
        {/* Abstract animated solar-cell grid — original graphic, ties visually to the flagship service */}
        <div
          aria-hidden
          className="absolute inset-0 grid grid-cols-6 gap-[3px] p-6 sm:p-10 opacity-90"
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="bg-graphite border border-darkgrey rounded-[2px]"
              style={{ animationDelay: `${(i % 6) * 180 + Math.floor(i / 6) * 90}ms` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -inset-y-10 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-orange/15 to-transparent animate-shimmer" />
        </div>
        <div className="relative h-full flex items-end p-6 sm:p-10">
          <p className="text-mist text-xs uppercase tracking-widest font-heading font-semibold">
            Solar &middot; Paint &middot; Waterproofing &middot; Paving &middot; Plumbing &middot; Electrical &middot; and more
          </p>
        </div>
      </Reveal>
    </section>
  );
}
