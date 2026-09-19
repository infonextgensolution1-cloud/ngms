import Link from "next/link";
import Image from "next/image";
import HeroSlideshow from "@/components/HeroSlideshow";
import ServiceCard from "@/components/ServiceCard";
import { SERVICES } from "@/lib/services";
import { getHeroSlides, getBeforeAfter, getPosts } from "@/lib/queries";

export const revalidate = 300;

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

export default async function HomePage() {
  const [slides, beforeAfter, posts] = await Promise.all([getHeroSlides(), getBeforeAfter(), getPosts()]);
  const featuredBA = beforeAfter[0];

  return (
    <>
      <section className="grid md:grid-cols-2 min-h-[85vh]">
        <div className="flex flex-col justify-center px-6 md:px-10 py-12">
          <p className="kicker">NextGen Solar &amp; Maintenance Solutions</p>
          <h1 className="text-[40px] md:text-[64px] leading-[1.05]">
            ONE CALL.
            <br />
            <span className="text-orange">ALL SOLUTIONS.</span>
          </h1>
          <p className="text-mist text-lg mt-5 max-w-[420px]">
            Professional property maintenance across the Helderberg Basin — solar, painting, waterproofing, paving
            and more, coordinated by one team.
          </p>
          <div className="flex gap-3 flex-wrap mt-7">
            <Link href="/projects" className="btn btn-ghost">View Projects</Link>
            <Link href="/quote" className="btn btn-wa">Get Free Quote</Link>
          </div>
          <p className="text-mist text-[11px] tracking-[0.16em] uppercase font-semibold mt-10">
            Serving Strand · Somerset West · Gordon&rsquo;s Bay · Helderberg Basin
          </p>
        </div>
        <HeroSlideshow slides={slides} />
      </section>

      <div className="bg-orange text-white text-center font-bold text-sm py-3 px-4">
        10% OFF your first booking (excludes solar) · Solar panel cleaning from R550
      </div>

      <div className="bg-graphite grid grid-cols-2 md:grid-cols-4 gap-4 py-10 px-4 max-w-[900px] mx-auto text-center">
        <Stat n="12" label="Trade Services" />
        <Stat n="100%" label="Helderberg-Based" />
        <Stat n="1" label="Point of Contact" />
        <Stat n="7" label="Step Process" />
      </div>

      <section className="py-14 px-4 text-center">
        <p className="kicker">What we do</p>
        <h2 className="text-3xl md:text-4xl">EVERYTHING YOUR PROPERTY NEEDS</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-left max-w-wrap mx-auto mt-6">
          {SERVICES.slice(0, 6).map((s) => (
            <ServiceCard key={s.slug} s={s} />
          ))}
        </div>
        <p className="mt-7">
          <Link href="/services" className="text-blue font-bold">View all 12 services →</Link>
        </p>
      </section>

      <section className="py-14 px-4 text-center bg-graphite border-y border-line">
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
      </section>

      {featuredBA && (
        <section className="py-14 px-4 text-center">
          <p className="kicker">See the difference</p>
          <h2 className="text-3xl md:text-4xl">Before &amp; After</h2>
          <div className="grid grid-cols-2 gap-4 max-w-[720px] mx-auto mt-6">
            <figure>
              <div className="relative h-[220px] rounded-xl overflow-hidden">
                <Image src={featuredBA.before_image_url} alt="Before" fill className="object-cover" />
              </div>
              <figcaption className="text-mist text-xs mt-2 uppercase">Before</figcaption>
            </figure>
            <figure>
              <div className="relative h-[220px] rounded-xl overflow-hidden">
                <Image src={featuredBA.after_image_url} alt="After" fill className="object-cover" />
              </div>
              <figcaption className="text-mist text-xs mt-2 uppercase">After</figcaption>
            </figure>
          </div>
          <p className="mt-7">
            <Link href="/projects" className="btn">View All Projects</Link>
          </p>
        </section>
      )}

      {posts.length > 0 && (
        <section className="py-14 px-4 text-center bg-graphite border-t border-line">
          <p className="kicker">From the Helderberg</p>
          <h2 className="text-3xl md:text-4xl">Tips &amp; Local Updates</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-wrap mx-auto mt-6">
            {posts.slice(0, 4).map((p) => (
              <Link key={p.slug} href={`/tips/${p.slug}`} className="card block">
                <p className="tag">{(p.type || "").replace("_", " ")}</p>
                <h3 className="text-base mt-1">{p.title}</h3>
                <p className="text-mist text-sm mt-2">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <b className="block font-display text-3xl text-orange">{n}</b>
      <span className="text-mist text-[11px] tracking-wider uppercase font-semibold">{label}</span>
    </div>
  );
}
