import Link from "next/link";

// Homepage block for trustees and managing agents — most of them arrive
// from the body corporate outreach emails and need to see themselves on
// the page straight away.
const POINTS = [
  {
    title: "Rooftop & communal solar",
    body: "Scheduled purified-water cleans for shared arrays, planned around residents and access rules.",
  },
  {
    title: "One contractor, one invoice",
    body: "Solar, high-pressure cleaning, painting, waterproofing and paving handled by one team, so there's one point of contact for the trustees.",
  },
  {
    title: "Written scope before we start",
    body: "Free site walk-through, then a written quote the trustees can table at the next meeting.",
  },
];

export default function BodyCorporateSection() {
  return (
    <section className="bg-jet border-t border-darkgrey py-16 px-4">
      <div className="wrap grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="kicker">For Body Corporates &amp; Security Complexes</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-paper">
            Maintenance Your Trustees Don&apos;t Have To Chase
          </h2>
          <p className="text-mist text-lg mt-4 max-w-md">
            Quarterly and annual plans for complexes across Strand, Somerset West and Gordon&apos;s Bay. Recent
            complex work includes painting, paving and waterproofing at Cosmos Mews in Strand.
          </p>
          <div className="flex gap-4 flex-wrap mt-8">
            <Link
              href="/quote?service=Solar%20Panel%20Cleaning"
              className="btn bg-orange text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange/20"
            >
              BOOK A SITE WALK-THROUGH
            </Link>
            <Link href="/maintenance-packages" className="btn-outline">
              COMPLEX PACKAGES
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {POINTS.map((p) => (
            <div key={p.title} className="card hover:border-orange/50 transition-colors">
              <h3 className="font-heading font-bold text-paper text-lg">{p.title}</h3>
              <p className="text-mist mt-1">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
