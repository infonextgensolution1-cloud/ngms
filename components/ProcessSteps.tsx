import PlusCluster from "@/components/motion/PlusCluster";
import Reveal from "@/components/motion/Reveal";

// Ember Grid signature element #3 — numbered process steps in outlined
// squares. Copy reflects how NGMS already describes its own process
// elsewhere on the site (free site walk-through → written quote →
// before/after photos), just gathered into one "how it works" strip.
const STEPS = [
  {
    n: "01",
    title: "Tell us what's needed",
    body: "WhatsApp us or request a quote online — whichever's easier. Takes two minutes.",
  },
  {
    n: "02",
    title: "Free site visit",
    body: "We walk the property, check access and confirm scope before any number goes on paper.",
  },
  {
    n: "03",
    title: "Written quote, no surprises",
    body: "A clear, itemised quote you can approve on the spot or table at your next trustee meeting.",
  },
  {
    n: "04",
    title: "Work done, then signed off",
    body: "Before-and-after photos and a walkthrough before we call the job complete.",
  },
];

export default function ProcessSteps() {
  return (
    <section className="bg-graphite border-y border-darkgrey py-16 sm:py-20 px-4">
      <div className="wrap">
        <Reveal className="text-center mb-12">
          <PlusCluster className="mx-auto mb-4" />
          <p className="kicker">How It Works</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-paper">
            FROM MESSAGE TO SIGN-OFF
          </h2>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delayMs={i * 110} className="relative">
              <div className="h-full flex flex-col gap-4">
                <div className="h-12 w-12 rounded-btn border-2 border-orange text-orange font-heading font-bold text-lg flex items-center justify-center">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-paper text-lg">{step.title}</h3>
                  <p className="text-mist mt-1.5 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="hidden lg:block absolute top-6 -right-3 w-6 h-px bg-darkgrey"
                />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
