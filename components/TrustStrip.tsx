import Image from "next/image";
import Link from "next/link";
import type { BeforeAfter } from "@/lib/queries";

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
    <section className="py-14 px-4 bg-graphite border-y border-line">
      <div className="wrap">
        {pairs.length > 0 && (
          <div className="text-center mb-10">
            <p className="kicker">See the difference</p>
            <h2 className="text-3xl md:text-4xl">Real Jobs, Real Results</h2>
            <div className={`grid gap-4 mt-6 ${pairs.length === 1 ? "max-w-[520px] mx-auto" : "sm:grid-cols-2 md:grid-cols-3"}`}>
              {pairs.map((item, idx) => (
                <div key={idx} className="card !p-0 overflow-hidden text-left">
                  <div className="grid grid-cols-2">
                    <div className="relative h-[150px]">
                      <Image src={item.before_image_url} alt="Before" fill className="object-cover" />
                      <span className="absolute top-1.5 left-1.5 bg-jet/80 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
                        Before
                      </span>
                    </div>
                    <div className="relative h-[150px]">
                      <Image src={item.after_image_url} alt="After" fill className="object-cover" />
                      <span className="absolute top-1.5 left-1.5 bg-orange/90 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
                        After
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm">{item.caption || "Another Project Successfully Completed"}</p>
                    <p className="tag">{item.location}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6">
              <Link href="/projects" className="text-blue font-bold">View all projects →</Link>
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="kicker">Reviews</p>
          <h2 className="text-3xl md:text-4xl">What Our Clients Say</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-left max-w-wrap mx-auto mt-6">
            {REVIEWS.map((r) => (
              <div key={r.name} className="card">
                <p className="text-orange">★★★★★</p>
                <p className="text-mist my-3">&ldquo;{r.quote}&rdquo;</p>
                <strong>{r.name}</strong>
                <p className="text-mist text-xs">{r.source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
