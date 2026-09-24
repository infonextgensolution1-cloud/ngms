const TIPS = [
  {
    tag: 'Solar panels',
    title: 'Rinse, don’t blast',
    body: 'Rinse with cool, clean water early in the morning or after sunset. Cold water on hot glass leaves streaks and can stress it. Use a soft brush or sponge only: no pressure washer and no harsh chemicals. Coastal salt and bird droppings are what really rob you of output here.',
    pro: 'Panels on a pitched or high roof? Leave it to us. A fall isn’t worth a few extra watts.',
  },
  {
    tag: 'Damp & waterproofing',
    title: 'Spring is inspection season',
    body: 'After winter rain, look for bubbling or flaking paint, dark patches, white powdery salt on walls, and puddles that sit on a flat roof for more than 48 hours. Small leaks are cheap to fix. Ceilings and DB boards aren’t.',
    pro: 'Damp coming through a wall or ceiling? Painting over it only hides the problem.',
  },
  {
    tag: 'Paving',
    title: 'Re-sand the joints',
    body: 'Pull the weeds, sweep out the old joint sand, then brush in fresh kiln-dried sand so the bricks lock together and weeds can’t get a foothold. A gentle wash first helps. Clear drains and channels before the next cold front.',
    pro: 'Sunken or rocking bricks mean the base has moved. That needs a re-lay, not a top-up.',
  },
  {
    tag: 'Painting',
    title: 'Prep is 80% of the job',
    body: 'Wash the wall, scrape anything loose, fill cracks and prime bare patches. Only paint when the surface is dry, out of the midday sun, and no rain is forecast for the next 24 hours.',
    pro: 'Paint that keeps peeling usually means damp behind the wall. Sort that out first.',
  },
  {
    tag: 'Pools',
    title: 'Never drain it yourself',
    body: 'Emptying a fibreglass pool can lift or crack the shell when the water table is high. Keep the level right, brush the walls weekly and keep pH around 7.2 to 7.6.',
    pro: 'Chalky, rough or blistering fibre? That’s a relining job.',
  },
  {
    tag: 'Plumbing & electrical',
    title: 'Two 30-second safety checks',
    body: 'Leak test: close every tap, then check your water meter. If it still moves, you have a leak. Trip test: press the test button on your earth-leakage switch once a month. It should trip straight away.',
    pro: 'If it doesn’t trip, or the meter keeps running, call a professional. DB board and wiring work needs a registered electrician and a Certificate of Compliance.',
  },
]

// Practical, seasonal DIY tips for Helderberg homeowners. Each one ends with the
// point where it stops being a DIY job, which is where we come in.
export default function DiyTips() {
  return (
    <section className="bg-jet px-4 py-16" aria-labelledby="diy-tips">
      <div className="wrap">
        <div className="mb-12 text-center">
          <p className="kicker">DIY tips</p>
          <h2 id="diy-tips" className="text-3xl md:text-4xl">
            Helderberg DIY Tips
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-mist">
            Quick wins you can do yourself, and how to tell when it&rsquo;s time to call in a pro.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((t) => (
            <article key={t.tag} className="flex flex-col rounded-card border border-darkgrey bg-cardgrey p-6">
              <p className="tag text-orange">{t.tag}</p>
              <h3 className="mt-2 font-heading text-xl font-bold text-paper">{t.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">{t.body}</p>
              <p className="mt-auto border-t border-darkgrey pt-4 text-sm leading-relaxed text-paper">
                <span className="font-heading font-bold uppercase tracking-wide text-orange">Call a pro if: </span>
                {t.pro}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/quote"
            className="inline-block rounded-full btn-glow px-9 py-3 font-heading text-base font-bold uppercase tracking-wide transition"
          >
            Get a Free Quote
          </a>
          <a
            href="https://wa.me/27631387945?text=Hi%20NGSMS%2C%20I%20read%20your%20DIY%20tips%20and%20could%20use%20a%20hand%20with%20a%20job."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa rounded-full px-9"
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  )
}
