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
import BodyCorporateSection from '@/components/BodyCorporateSection'
import ProcessSteps from '@/components/ProcessSteps'
import SplitCta from '@/components/SplitCta'
import Reveal from '@/components/motion/Reveal'
import PlusCluster from '@/components/motion/PlusCluster'
import SunBurst from '@/components/motion/SunBurst'
import { whatsappLink } from '@/lib/site'
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

const HERO_BADGES = ['12 Trades, One Team', 'Free Written Quotes', 'Local Helderberg Team']

export default async function HomePage() {
  const [slides, beforeAfter] = await Promise.all([getHeroSlides(), getBeforeAfter()])

  return (
    <main className="bg-jet">
      <SeasonalBanner />

      {/* ---------- HERO ---------- */}
      <section className="relative grid md:grid-cols-2 overflow-hidden">
        {/* Ambient drifting grid, very low opacity — texture, not distraction */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] animate-grid-drift"
          style={{
            backgroundImage:
              'linear-gradient(#F57C1B 1px, transparent 1px), linear-gradient(90deg, #F57C1B 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Decorative sunburst, tucked behind the copy on larger screens */}
        <SunBurst className="hidden lg:block absolute -right-24 top-1/2 -translate-y-1/2 h-[560px] w-[560px] opacity-70 md:right-[-140px]" />

        <div className="relative flex flex-col justify-center px-6 sm:px-12 py-16 md:py-0 min-h-[70vh] md:min-h-[85vh]">
          <PlusCluster className="mb-5" />
          <p className="text-blue text-xs tracking-[0.2em] uppercase font-bold mb-4 font-heading animate-fade-up">
            One Call. All Solutions.
          </p>
          <h1 className="font-heading font-bold text-4xl sm:text-6xl leading-[1.05] text-paper">
            <span className="block overflow-hidden py-1">
              <span className="inline-block animate-fade-up">DIRTY PANELS COST YOU</span>
            </span>
            <span className="block overflow-hidden py-1">
              <span className="inline-block text-orange animate-fade-up delay-2">UP TO 25% OUTPUT.</span>
            </span>
          </h1>
          <p className="text-mist text-lg mt-6 max-w-md animate-fade-up delay-3">
            Professional solar panel cleaning across Strand, Somerset West and Gordon&apos;s Bay. Purified water and
            soft brushes, no callout fee in the Helderberg Basin. From R550.
          </p>
          <div className="flex gap-4 mt-8 flex-wrap animate-fade-up delay-3">
            <Link
              href="/quote?service=Solar%20Panel%20Cleaning"
              className="btn bg-orange text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange/20"
            >
              GET FREE QUOTE
            </Link>
            <a
              href={whatsappLink("Hi NextGen, I'd like a quote for solar panel cleaning please.")}
              className="btn-wa"
              target="_blank"
              rel="noreferrer"
            >
              WHATSAPP US
            </a>
          </div>
          <p className="text-mist text-sm mt-6 animate-fade-up delay-4">
            Also painting, waterproofing, paving and 8 more trades.{' '}
            <Link href="/services" className="text-blue font-semibold hover:underline">
              See all services &rarr;
            </Link>
          </p>

          <div className="flex flex-wrap gap-2.5 mt-8 animate-fade-up delay-4">
            {HERO_BADGES.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 border border-orange/40 text-mist text-[11px] uppercase tracking-wide font-semibold px-3 py-1.5 rounded-btn"
              >
                <span aria-hidden className="text-orange">
                  +
                </span>
                {badge}
              </span>
            ))}
          </div>

          <p className="text-mist text-xs tracking-widest uppercase mt-8 font-semibold">
            Serving Strand · Somerset West · Gordon&apos;s Bay · Overberg
          </p>
        </div>

        <HeroSlideshow slides={slides} />
      </section>

      <div className="bg-orange text-white text-center text-sm font-bold py-2">
        Solar panel cleaning from R550 (up to 10 panels) · 10% off your first booking on all other services
      </div>

      {/* Solar ROI calculator — the best selling tool, straight under the hero */}
      <section className="bg-jet py-14 px-4 text-center">
        <Reveal>
          <PlusCluster className="mx-auto mb-4" />
          <p className="kicker">60-Second Estimate</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2 text-paper">
            NOT SURE HOW MUCH YOU&apos;RE LOSING?
          </h2>
          <p className="text-mist text-lg max-w-xl mx-auto mb-8">
            Drag the sliders for a rough idea of what soiled panels are costing you — then get the exact number.
          </p>
        </Reveal>
        <Reveal delayMs={100} className="max-w-[520px] mx-auto">
          <SolarRoiCalculator />
        </Reveal>
      </section>

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

      {/* How it works — signature numbered-process element */}
      <ProcessSteps />

      <section className="bg-jet text-white py-14 text-center">
        <Reveal>
          <PlusCluster className="mx-auto mb-4" />
          <p className="kicker">Instant Estimate</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2 text-paper">
            SEE A BALLPARK NUMBER IN SECONDS
          </h2>
          <p className="text-mist text-lg max-w-xl mx-auto mb-8">
            Drag the sliders for a rough idea, then request the exact price — no obligation.
          </p>
        </Reveal>
        <Reveal delayMs={100} className="max-w-[520px] mx-auto px-4 text-left">
          <PavingCalculator />
        </Reveal>
      </section>

      <StatsStrip />

      <BodyCorporateSection />

      <HomeServices services={services} />

      {/* Full-bleed orange split — signature element */}
      <SplitCta />

      <section className="bg-graphite border-t border-darkgrey py-16 px-4 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -left-16 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-orange/10 blur-3xl animate-floaty"
        />
        <div
          aria-hidden
          className="absolute -right-16 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-blue/10 blur-3xl animate-floaty"
        />
        <Reveal className="relative wrap">
          <PlusCluster className="mx-auto mb-5" />
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
        </Reveal>
      </section>
    </main>
  )
}
