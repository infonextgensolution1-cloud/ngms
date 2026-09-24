import Link from "next/link";

// Homepage block for trustees and managing agents — most of them arrive
// from the body corporate outreach emails and need to see themselves on
// the page straight away.
//
// Solar Forge: this is the homepage's one full orange panel. Text on the
// orange is Jet (7.3:1); the three points sit on Jet cards.
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
    <section className="bg-orange text-jet py-16 px-4">
      <div className="wrap grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="kicker !text-jet">For Body Corporates &amp; Security Complexes</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-jet">
            Maintenance Your Trustees Don&apos;t Have To Chase
          </h2>
          <p className="text-jet text-lg mt-4 max-w-md">
            Quarterly and annual plans for complexes across Strand, Somerset West and Gordon&apos;s Bay. Recent
            complex work includes painting, paving and waterproofing at Cosmos Mews in Strand.
          </p>
          <div className="flex gap-4 flex-wrap mt-8">
            <Link
              href="/quote?service=Solar%20Panel%20Cleaning"
              className="btn-jet"
            >
              BOOK A SITE WALK-THROUGH
            </Link>
            <Link href="/maintenance-packages" className="btn-outline-jet">
              COMPLEX PACKAGES
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {POINTS.map((p) => (
            <div key={p.title} className="card !bg-jet !border-jet">
              <h3 className="font-heading font-bold text-paper text-lg">{p.title}</h3>
              <p className="text-mist mt-1">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
