import Link from "next/link";
import type { Metadata } from "next";
import NgmsIcon from "@/components/NgmsIcon";

export const metadata: Metadata = {
  title: "Maintenance Packages",
  description: "Recurring maintenance packages for Helderberg homes and complexes.",
};

const PACKAGES = [
  {
    name: "Basic Care",
    icon: "calendar",
    cadence: "Every 6 months",
    price: "From R850",
    items: "Solar clean (up to 20 panels) · gutter flush · exterior inspection · priority booking",
  },
  {
    name: "Standard Care",
    icon: "recurring",
    cadence: "Every 4 months",
    price: "From R1 450",
    items: "Solar clean · gutters · driveway wash · 30 min handyman · 15% off solar",
    popular: true,
  },
  {
    name: "Complete Care",
    icon: "walkthrough",
    cadence: "Every 3 months",
    price: "From R2 200",
    items: "Full exterior wash · handyman hour · waterproofing inspection · fastest response",
  },
];

export default function PackagesPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-darkgrey py-14 px-4 text-center">
        <p className="text-orange text-xs tracking-[0.2em] uppercase font-bold mb-3 font-heading">Plans</p>
        <h1 className="font-heading font-bold text-4xl md:text-5xl text-paper uppercase">Maintenance packages</h1>
        <p className="text-mist mt-3">
          Market-related plans for Helderberg homes and complexes — book once, we handle the schedule.
        </p>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PACKAGES.map((p, i) => (
            <div
              key={p.name}
              className={`group bg-cardgrey border rounded-card p-5 ${p.popular ? "border-orange" : "border-darkgrey hover:border-orange"} transition-colors`}
            >
              <NgmsIcon name={p.icon} index={i} className="h-12 w-12 mb-3" />
              {p.popular && (
                <p className="text-orange text-xs font-bold uppercase tracking-wide mb-2">Most Popular</p>
              )}
              <h3 className="font-heading font-bold text-lg text-paper">{p.name}</h3>
              <p className="text-mist text-sm">{p.cadence}</p>
              <p className="text-orange font-heading font-bold text-2xl my-3">{p.price}</p>
              <p className="text-mist text-sm">{p.items}</p>
            </div>
          ))}
        </div>
        <p className="text-mist text-sm mt-8">
          Every package can be combined with any other service at a member discount — ask about bundling painting,
          waterproofing or paving into your plan.
        </p>
        <p className="mt-6">
          <Link
            href="/quote"
            className="inline-block bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-sm px-6 py-3 rounded-btn"
          >
            Ask About Packages
          </Link>
        </p>
      </div>
    </section>
  );
}
