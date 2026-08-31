import Link from 'next/link'
import { services } from '@/lib/services'
import { supabase } from '@/lib/supabaseClient'
import { HeroSlideshow } from '@/components/hero-slideshow'

export const revalidate = 0

type Slide = {
  id: string
  image_url: string
  alt_text: string
  caption: string | null
}

async function getHeroSlides(): Promise<Slide[]> {
  const { data } = await supabase
    .from('hero_slides')
    .select('id, image_url, alt_text, caption')
    .eq('is_active', true)
    .order('sort_order')
  return (data as Slide[]) ?? []
}

const REVIEWS = [
  {
    name: 'Alewyn Bronn',
    source: 'Google Review — 5 stars',
    quote: 'Reasonable price. Professional cleaning on 3 of my commercial buildings.',
  },
  {
    name: 'Marlene Bronn',
    source: 'Facebook',
    quote: 'Impressive guys, a job well done!',
  },
  {
    name: 'Cornellskop Animal Encounters',
    source: 'Facebook',
    quote: 'Fantastic service, great communication! No hidden costs — did really great work at heights I avoid.',
  },
]

export default async function HomePage() {
  const slides = await getHeroSlides()

  return (
    <main className="bg-jet">
      <section className="grid md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 sm:px-12 py-16 md:py-0 min-h-[70vh] md:min-h-[85vh]">
          <p className="text-blue text-xs tracking-[0.2em] uppercase font-bold mb-4 font-heading">
            NextGen Solar &amp; Maintenance Solutions
          </p>
          <h1 className="font-heading font-bold text-5xl sm:text-6xl leading-[1.05] text-paper">
            ONE CALL.
            <br />
            <span className="text-orange">ALL SOLUTIONS.</span>
          </h1>
          <p className="text-mist text-lg mt-6 max-w-md">
            Professional property maintenance across the Helderberg Basin — solar, painting,
            waterproofing, paving and more, coordinated by one team.
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <Link
              href="/portfolio"
              className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-orange hover:text-orange transition"
            >
              VIEW PROJECTS
            </Link>
            <Link
              href="/quote"
              className="bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold px-6 py-3 rounded-btn"
            >
              GET FREE QUOTE
            </Link>
          </div>
          <p className="text-mist text-xs tracking-widest uppercase mt-10 font-semibold">
            Serving Strand · Somerset West · Gordon&apos;s Bay · Helderberg Basin
          </p>
        </div>

        <HeroSlideshow slides={slides} />
      </section>

      <div className="bg-orange text-white text-center text-sm font-bold py-2">
        10% OFF your first booking · Solar panel cleaning from R50/panel
      </div>

      <section className="bg-graphite text-white py-10 border-b border-darkgrey">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-heading text-3xl font-bold text-orange">12</p>
            <p className="text-xs text-mist uppercase tracking-wide font-semibold">Trade Services</p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-orange">100%</p>
            <p className="text-xs text-mist uppercase tracking-wide font-semibold">Helderberg-Based</p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-orange">1</p>
            <p className="text-xs text-mist uppercase tracking-wide font-semibold">Point of Contact</p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-orange">7</p>
            <p className="text-xs text-mist uppercase tracking-wide font-semibold">Step Process</p>
          </div>
        </div>
      </section>

      <section className="bg-jet text-white py-14 text-center">
        <p className="text-blue font-bold text-sm mb-2 font-heading tracking-wide">WHAT WE DO</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-10 text-paper">EVERYTHING YOUR PROPERTY NEEDS</h2>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
          {services.slice(0, 6).map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="bg-cardgrey border border-darkgrey rounded-card p-4 hover:border-orange transition"
            >
              <p className="font-heading font-semibold text-sm text-paper">{service.name}</p>
              <p className="text-orange text-xs font-bold mt-1">{service.tagline}</p>
            </Link>
          ))}
        </div>
        <Link href="/services" className="inline-block mt-8 text-blue font-bold text-sm">
          View all 12 services &rarr;
        </Link>
      </section>

      <section className="bg-graphite text-white py-14 text-center border-y border-darkgrey">
        <p className="text-blue font-bold text-sm mb-2 font-heading tracking-wide">REVIEWS</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-10 text-paper">What Our Clients Say</h2>
        <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-6 text-left">
          {REVIEWS.map((review) => (
            <div key={review.name} className="bg-cardgrey border border-darkgrey rounded-card p-6">
              <p className="text-orange text-lg mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
              <p className="text-mist text-sm mb-4">&ldquo;{review.quote}&rdquo;</p>
              <p className="font-heading font-semibold text-sm text-paper">{review.name}</p>
              <p className="text-mist text-xs mt-1 opacity-70">{review.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-jet text-white py-14 text-center">
        <p className="text-blue font-bold text-sm mb-2 font-heading tracking-wide">SEE THE DIFFERENCE</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4 text-paper">Before &amp; After</h2>
        <p className="text-mist text-lg max-w-xl mx-auto mb-8">
          Real before-and-after results from recent NGSMS jobs — photos loading soon.
        </p>
        <Link href="/portfolio" className="inline-block bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
          View All Projects
        </Link>
      </section>
    </main>
  )
}
