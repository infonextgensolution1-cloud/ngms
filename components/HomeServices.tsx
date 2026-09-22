import Link from "next/link";
import type { Service } from "@/lib/services";

// Small inline line icons, keyed by service slug. The services data has
// no icon field, so these live here — just the six shown on the homepage
// bento grid (services.slice(0, 6)).
function ServiceIcon({ slug, className }: { slug: string; className?: string }) {
  const common = { className, strokeWidth: 1.75, fill: "none", stroke: "currentColor" };
  switch (slug) {
    case "solar-panel-cleaning":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 8l7-3 9 3-9 3-7-3Z" strokeLinejoin="round" />
          <path d="M4 8v8l7 3 9-3V8" strokeLinejoin="round" />
          <path d="M11 5v14" />
        </svg>
      );
    case "painting":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M4 21v-3a3 3 0 0 1 3-3h2l9-9 3 3-9 9v2a3 3 0 0 1-3 3H4Z" strokeLinejoin="round" />
          <path d="M14 6l4 4" />
        </svg>
      );
    case "waterproofing":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" strokeLinejoin="round" />
        </svg>
      );
    case "paving":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "plumbing":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M7 3v5a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V3" strokeLinecap="round" />
          <path d="M10 11v5a4 4 0 0 0 4 4h3" strokeLinecap="round" />
          <circle cx="19" cy="18" r="2" />
        </svg>
      );
    case "electrical":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 2 3 7l9 5 9-5-9-5Z" strokeLinejoin="round" />
          <path d="M3 12l9 5 9-5" strokeLinejoin="round" />
        </svg>
      );
  }
}

export default function HomeServices({ services }: { services: Service[] }) {
  const featured = services[0];
  const rest = services.slice(1, 6);

  return (
    <section className="bg-jet text-white py-16 sm:py-20 text-center">
      <p className="kicker">What We Do</p>
      <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-10 text-paper">
        EVERYTHING YOUR PROPERTY NEEDS
      </h2>

      <div className="wrap grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        {featured && (
          <Link
            href={`/services/${featured.slug}`}
            className="group relative overflow-hidden col-span-2 md:col-span-2 md:row-span-2 bg-cardgrey border border-darkgrey rounded-card p-6 flex flex-col justify-between min-h-[220px] hover:border-orange transition-colors"
          >
            <div
              aria-hidden
              className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-orange/10 blur-2xl group-hover:bg-orange/20 transition-colors"
            />
            <div className="relative">
              <div className="h-12 w-12 rounded-btn bg-orange/10 text-orange flex items-center justify-center mb-6 group-hover:bg-orange group-hover:text-jet transition-colors">
                <ServiceIcon slug={featured.slug} className="h-6 w-6" />
              </div>
              <p className="font-heading font-bold text-xl sm:text-2xl text-paper">{featured.name}</p>
              <p className="text-orange text-sm font-bold mt-2">{featured.tagline}</p>
            </div>
            <span className="relative mt-6 inline-flex items-center gap-2 text-mist text-xs uppercase tracking-widest font-semibold group-hover:text-orange transition-colors">
              Learn more
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </span>
          </Link>
        )}

        {rest.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="group relative bg-cardgrey border border-darkgrey rounded-card p-4 flex flex-col justify-between hover:border-orange transition-colors"
          >
            <div className="h-10 w-10 rounded-btn bg-orange/10 text-orange flex items-center justify-center mb-4 group-hover:bg-orange group-hover:text-jet transition-colors">
              <ServiceIcon slug={service.slug} className="h-5 w-5" />
            </div>
            <p className="font-heading font-semibold text-sm text-paper">{service.name}</p>
            <p className="text-orange text-xs font-bold mt-1">{service.tagline}</p>
          </Link>
        ))}
      </div>

      <Link href="/services" className="btn-outline inline-flex mt-10">
        View All 12 Services &rarr;
      </Link>
    </section>
  );
}
