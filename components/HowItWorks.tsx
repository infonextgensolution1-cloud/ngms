import NgmsIcon from "@/components/NgmsIcon";

const STEPS = [
  {
    n: "01",
    icon: "send-photo",
    title: "Send the job",
    body: "WhatsApp a photo or call us — tell us what needs doing and where.",
  },
  {
    n: "02",
    icon: "quote",
    title: "Get a straight quote",
    body: "Fixed, itemised price — often the same day. No site visit needed for most jobs.",
  },
  {
    n: "03",
    icon: "subcontractor-work",
    title: "We get it done",
    body: "One scheduled crew, right tools for the trade, worked around Cape weather when it matters.",
  },
  {
    n: "04",
    icon: "walkthrough",
    title: "Walkthrough & follow-up",
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
          <h2 className="text-3xl md:text-4xl">Four steps to a finished job</h2>
        </div>
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-darkgrey" aria-hidden />
          {STEPS.map((step, i) => (
            <div key={step.n} className="group relative text-center">
              <div className="relative z-10 w-12 h-12 rounded-full bg-orange text-jet font-heading font-bold text-lg grid place-items-center mx-auto mb-4">
                {step.n}
              </div>
              <NgmsIcon name={step.icon} index={i} className="h-12 w-12 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-base text-paper uppercase tracking-wide">{step.title}</h3>
              <p className="text-mist text-sm mt-2 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
