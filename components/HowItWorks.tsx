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
    <section className="bg-jet py-16 sm:py-24 px-4" aria-labelledby="process-title">
      <div className="wrap">
        <div className="max-w-2xl mb-12">
          <p className="kicker">How it works</p>
          <h2 id="process-title" className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05]">From photo to finished job in four steps</h2>
        </div>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <li key={step.n} className="group panel p-6 relative">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-sm text-blue tracking-[0.18em]">{step.n}</span>
                <NgmsIcon name={step.icon} index={i} className="h-10 w-10" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-paper normal-case tracking-normal mt-6">{step.title}</h3>
              <p className="text-mist text-sm mt-2 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
