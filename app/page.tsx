import Link from 'next/link'
import { services } from '@/lib/services'
import { supabase } from '@/lib/supabaseClient'
import { HeroSlideshow } from '@/components/hero-slideshow'
import SeasonalBanner from '@/components/SeasonalBanner'
import TrustStrip from '@/components/TrustStrip'
import SolarRoiCalculator from '@/components/SolarRoiCalculator'
import PavingCalculator from '@/components/PavingCalculator'
import StatsStrip from '@/components/StatsStrip'
import HomeServices from '@/components/HomeServices'
import { getBeforeAfter } from '@/lib/queries'

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

const TICKER_ITEMS = services.map((s) => s.name)

export default async function HomePage() {
  const [slides, beforeAfter] = await Promise.all([getHeroSlides(), getBeforeAfter()])

  return (
    <main className="bg-jet">
      <SeasonalBanner />

      <section className="grid md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 sm:px-12 py-16 md:py-0 min-h-[70vh] md:min-h-[85vh]">
          <p className="text-blue text-xs tracking-[0.2em] uppercase font-bold mb-4 font-heading">
            NextGen Solar &amp; Maintenance Solutions
          </p>
          <h1 className="font-heading font-bold text-5xl sm:text-6xl leading-[1.05] text-paper animate-fade-up">
            ONE CALL.
            <br />
            <span className="text-orange">ALL SOLUTIONS.</span>
          </h1>
          <p className="text-mist text-lg mt-6 max-w-md">
            Professional property maintenance across the Helderberg Basin — solar, painting,
            waterproofing, paving and more, coordinated by one team.
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <Link href="/portfolio" className="btn-outline">
              VIEW PROJECTS
            </Link>
            <Link href="/quote" className="btn-wa">
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

      {/* Scrolling service ticker — quick, always-moving proof of breadth */}
      <div className="bg-jet border-b border-darkgrey overflow-hidden py-3">
        <div className="flex w-max animate-marquee">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="flex items-center text-mist text-xs uppercase tracking-[0.15em] font-heading font-semibold px-6 whitespace-nowrap"
            >
              {name}
              <span className="text-orange ml-6" aria-hidden>
                &bull;
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Before/after + reviews, right under the hero — not buried further down the page */}
      <TrustStrip beforeAfter={beforeAfter} />

      <section className="bg-jet text-white py-14 text-center">
        <p className="kicker">Instant Estimate</p>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2 text-paper">See A Ballpark Number In Seconds</h2>
        <p className="text-mist text-lg max-w-xl mx-auto mb-8">
          Drag the sliders for a rough idea, then request the exact price — no obligation.
        </p>
        <div className="grid md:grid-cols-2 gap-4 max-w-[760px] mx-auto px-4 text-left">
          <SolarRoiCalculator />
          <PavingCalculator />
        </div>
      </section>

      <StatsStrip />

      <HomeServices services={services} />

      <section className="bg-graphite border-t border-darkgrey py-16 px-4 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -left-16 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-orange/10 blur-3xl animate-floaty"
        />
        <div
          aria-hidden
          className="absolute -right-16 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-blue/10 blur-3xl animate-floaty"
        />
        <div className="relative wrap">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-paper">
            READY TO GET STARTED?
          </h2>
          <p className="text-mist text-lg max-w-xl mx-auto mt-3 mb-8">
            One call covers all 12 trades. Tell us what needs doing and we&apos;ll get you a straight answer —
            usually the same day.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/quote" className="btn-wa">
              GET FREE QUOTE
            </Link>
            <a href="https://wa.me/27631387945" className="btn-outline">
              WHATSAPP US
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
