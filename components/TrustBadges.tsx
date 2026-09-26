import NgmsIcon from "@/components/NgmsIcon";

// Reasons to book, each backed by something we actually do — no generic
// "licensed & insured" filler, just what genuinely sets a one-crew,
// multi-trade Helderberg contractor apart from a single-trade competitor.
const BADGES = [
  {
    icon: "crew",
    title: "12 Trades, One Team",
    body: "Solar, painting, plumbing, electrical and more, coordinated by one Helderberg crew — no juggling separate contractors.",
  },
  {
    icon: "fixed-price",
    title: "Upfront Fixed Pricing",
    body: "Written quote before we start. What we quote is what you pay — no surprise line items.",
  },
  {
    icon: "fast-reply",
    title: "Fast WhatsApp Response",
    body: "Send a photo, get a fixed price — most quotes answered the same day.",
  },
  {
    icon: "local",
    title: "Helderberg Local",
    body: "Based in Strand, Gordon's Bay & Somerset West — we know the area, the weather and the buildings.",
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-jet py-12 px-4 border-y border-darkgrey">
      <div className="wrap grid grid-cols-2 sm:grid-cols-4 gap-6">
        {BADGES.map(({ icon, title, body }, i) => (
          <div key={title} className="group text-center">
            <div className="w-16 h-16 rounded-2xl bg-cardgrey border border-darkgrey grid place-items-center mx-auto mb-3 group-hover:border-orange transition-colors">
              <NgmsIcon name={icon} index={i} className="w-10 h-10" />
            </div>
            <h3 className="font-heading font-bold text-sm text-paper uppercase tracking-wide">{title}</h3>
            <p className="text-mist text-xs mt-1.5 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
