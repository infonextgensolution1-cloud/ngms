import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance Packages",
  description: "Recurring maintenance packages for Helderberg homes and complexes.",
};

const PACKAGES = [
  {
    name: "Basic Care",
    cadence: "Every 6 months",
    price: "from R850",
    items: "Solar clean (up to 20 panels) · gutter flush · exterior inspection · priority booking",
  },
  {
    name: "Standard Care",
    cadence: "Every 4 months",
    price: "from R1 450",
    items: "Solar clean · gutters · driveway wash · 30 min handyman · 15% off solar",
    popular: true,
  },
  {
    name: "Complete Care",
    cadence: "Every 3 months",
    price: "from R2 200",
    items: "Full exterior wash · handyman hour · waterproofing inspection · fastest response",
  },
];

export default function PackagesPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Plans</p>
        <h1 className="text-3xl md:text-5xl">Maintenance packages</h1>
        <p className="text-mist mt-2">Market-related plans for Helderberg homes and complexes — book once, we handle the schedule.</p>
      </div>
      <div className="wrap py-10">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PACKAGES.map((p) => (
            <div key={p.name} className={`card ${p.popular ? "!border-orange" : ""}`}>
              {p.popular && <p className="tag">Most Popular</p>}
              <h3 className="text-lg">{p.name}</h3>
              <p className="text-mist">{p.cadence}</p>
              <p className="tag !text-[22px] my-3">{p.price}</p>
              <p className="text-mist text-sm">{p.items}</p>
            </div>
          ))}
        </div>
        <p className="text-mist text-sm mt-8">
          Every package can be combined with any other service at a member discount — ask about bundling painting,
          waterproofing or paving into your plan.
        </p>
        <p className="mt-6">
          <Link href="/quote" className="btn">Ask About Packages</Link>
        </p>
      </div>
    </section>
  );
}
