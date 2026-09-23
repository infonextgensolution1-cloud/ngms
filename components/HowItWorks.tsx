const STEPS = [
  {
    n: "01",
    title: "Send The Job",
    body: "WhatsApp a photo or call us — tell us what needs doing and where.",
  },
  {
    n: "02",
    title: "Get A Straight Quote",
    body: "Fixed, itemised price — often the same day. No site visit needed for most jobs.",
  },
  {
    n: "03",
    title: "We Get It Done",
    body: "One scheduled crew, right tools for the trade, worked around Cape weather when it matters.",
  },
  {
    n: "04",
    title: "Walkthrough & Follow-Up",
    body: "We check the work with you. Ask about a maintenance plan for priority booking and a discount.",
  },
];

// Four-step process strip — answers "how does this actually work" before
// someone commits to a quote. Numbered circles with a connecting line on
// desktop, stacked on mobile.
export default function HowItWorks() {
  return (
    <section className="bg-graphite py-16 px-4 border-y border-darkgrey">
      <div className="wrap">
        <div className="text-center mb-12">
          <p className="kicker">How it works</p>
          <h2 className="text-3xl md:text-4xl">Four Steps To A Finished Job</h2>
        </div>
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-darkgrey" aria-hidden />
          {STEPS.map((step) => (
            <div key={step.n} className="relative text-center">
              <div className="relative z-10 w-12 h-12 rounded-full bg-orange text-jet font-heading font-bold text-lg grid place-items-center mx-auto mb-4">
                {step.n}
              </div>
              <h3 className="font-heading font-bold text-base text-paper uppercase tracking-wide">{step.title}</h3>
              <p className="text-mist text-sm mt-2 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
