import { Users, Receipt, MessageCircle, MapPin } from "lucide-react";

// Reasons to book, each backed by something we actually do — no generic
// "licensed & insured" filler, just what genuinely sets a one-crew,
// multi-trade Helderberg contractor apart from a single-trade competitor.
const BADGES = [
  {
    icon: Users,
    title: "12 Trades, One Team",
    body: "Solar, painting, plumbing, electrical and more, coordinated by one Helderberg crew — no juggling separate contractors.",
  },
  {
    icon: Receipt,
    title: "Upfront Fixed Pricing",
    body: "Written quote before we start. What we quote is what you pay — no surprise line items.",
  },
  {
    icon: MessageCircle,
    title: "Fast WhatsApp Response",
    body: "Send a photo, get a fixed price — most quotes answered the same day.",
  },
  {
    icon: MapPin,
    title: "Helderberg Local",
    body: "Based in Strand, Gordon's Bay & Somerset West — we know the area, the weather and the buildings.",
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-jet py-12 px-4 border-y border-darkgrey">
      <div className="wrap grid grid-cols-2 sm:grid-cols-4 gap-6">
        {BADGES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="text-center">
            <div className="w-11 h-11 rounded-full bg-cardgrey border border-darkgrey grid place-items-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-orange" strokeWidth={2} aria-hidden />
            </div>
            <h3 className="font-heading font-bold text-sm text-paper uppercase tracking-wide">{title}</h3>
            <p className="text-mist text-xs mt-1.5 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
