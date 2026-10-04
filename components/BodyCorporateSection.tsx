import Image from "next/image";
import Link from "next/link";
import NgmsIcon from "@/components/NgmsIcon";

// Homepage block for trustees and managing agents — most of them arrive
// from the body corporate outreach emails and need to see themselves on
// the page straight away.
//
// Solar Forge: dark band with an optional photo (Admin → Media → homepage slot
// "hero_feature"); NextGen Blue accents, orange only on the primary CTA.
const POINTS = [
  {
    title: "Rooftop & communal solar",
    icon: "solar-panel-cleaning",
    body: "Scheduled soft-wash cleans for shared arrays, planned around residents and access rules.",
  },
  {
    title: "One contractor, one invoice",
    icon: "invoice",
    body: "Solar, high-pressure cleaning, painting, waterproofing and paving handled by one team, so there's one point of contact for the trustees.",
  },
  {
    title: "Written scope before we start",
    icon: "quote",
    body: "Free site walk-through, then a written quote the trustees can table at the next meeting.",
  },
];

export default function BodyCorporateSection({ photo }: { photo?: { src: string; caption: string } }) {
  return (
    <section className="bg-graphite text-paper py-16 sm:py-24 px-4 border-y border-darkgrey" aria-labelledby="bc-title">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <p className="kicker">Body corporates &amp; security complexes</p>
          <h2 id="bc-title" className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05]">
            One contractor for the whole complex.
          </h2>
          <p className="text-mist text-base sm:text-lg mt-4 max-w-xl leading-relaxed">
            Quarterly and annual maintenance plans for complexes across Strand, Somerset West and Gordon&apos;s Bay.
            Recent complex work includes painting, paving and waterproofing at Cosmos Mews in Strand.
          </p>
          <ul className="grid gap-3 mt-8">
            {POINTS.map((p, i) => (
              <li key={p.title} className="group panel flex gap-4 items-start p-4">
                <NgmsIcon name={p.icon} index={i} className="h-10 w-10 shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-paper text-base normal-case tracking-normal">{p.title}</h3>
                  <p className="text-mist text-sm mt-1">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-3 flex-wrap mt-8">
            <Link href="/quote" className="btn-quote">
              Book a site walk-through
            </Link>
            <Link href="/maintenance-packages" className="btn-outline">
              Maintenance plans
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 relative aspect-[4/3] overflow-hidden rounded-panel border border-darkgrey bg-cardgrey">
          {photo?.src ? (
            <>
              <Image src={photo.src} alt={photo.caption} fill sizes="(max-width: 1024px) 100vw, 50vw" quality={70} className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-jet/70 via-transparent" />
              <p className="absolute left-4 right-4 bottom-4 text-sm text-paper/90">{photo.caption}</p>
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-mist text-sm">Complex maintenance</div>
          )}
        </div>
      </div>
    </section>
  );
}
