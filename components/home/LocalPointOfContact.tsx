import Link from 'next/link'

export default function LocalPointOfContact() {
  return (
    <section aria-labelledby="local-contact-heading" className="relative overflow-hidden border-y border-[#c9c8c4] bg-[#d9d9d6] px-5 py-14 text-[#111111] sm:px-8 sm:py-20 lg:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[32px] border-[#ff4b1b]/10 sm:h-96 sm:w-96 sm:border-[48px]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
        <div>
          <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.2em] text-[#333333]"><span className="h-1.5 w-9 bg-[#ff4b1b]" /> One local point of contact</p>
          <h2 id="local-contact-heading" className="mt-6 max-w-4xl text-[clamp(2.6rem,7vw,6.7rem)] font-black uppercase leading-[.82] tracking-[-.075em] text-[#111111]">
            Less chasing.<br /><span className="text-[#414141]">More getting done.</span>
          </h2>
        </div>
        <div className="lg:pb-1">
          <p className="max-w-2xl text-base font-medium leading-relaxed text-[#292929] sm:text-lg">
            From solar panel cleaning to repairs, painting and exterior maintenance, NGMS helps homeowners, body corporates and businesses manage property work with one reliable team.
          </p>
          <Link href="/services" className="mt-6 inline-flex min-h-12 items-center justify-between gap-8 border-2 border-[#111111] bg-[#111111] px-5 py-4 text-xs font-black uppercase tracking-[.1em] text-white transition hover:border-[#ff4b1b] hover:bg-[#ff4b1b] hover:text-[#111111]">
            View all services <span aria-hidden="true" className="text-lg">↗</span>
          </Link>
        </div>
      </div>
      <div aria-hidden="true" className="relative mx-auto mt-10 h-1 max-w-7xl bg-[#b9b9b5]"><div className="h-full w-1/4 bg-[#ff4b1b]" /></div>
    </section>
  )
}
