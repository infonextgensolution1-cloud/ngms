import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about NGSMS services and pricing.",
};

const FAQS: [string, string][] = [
  [
    "What areas do you service?",
    "The Helderberg Basin — Strand, Gordon's Bay, Somerset West — with no call-out fee. We also now take work in the Overberg (Kleinmond, Grabouw, Elgin, Bot River), where the standard R350 out-of-basin callout fee applies.",
  ],
  ["How much does solar panel cleaning cost?", "From R550 for up to 10 panels, scaling by system size. See the catalog for all tiers."],
  ["Do your prices include VAT?", "No — prices exclude VAT (15%)."],
  ["How often should solar panels be cleaned?", "Every 4–6 months for most Helderberg homes; more often near the coast or dusty roads."],
  ["Do you provide free quotes?", "Yes. Free site assessment, then a written, itemised quote valid for 30 days."],
];

export default function FaqPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Questions</p>
        <h1 className="text-3xl md:text-5xl">Frequently asked</h1>
      </div>
      <div className="wrap max-w-[720px] py-10">
        {FAQS.map(([q, a]) => (
          <details key={q} className="card mb-2.5">
            <summary className="cursor-pointer font-display">{q}</summary>
            <p className="text-mist text-sm mt-2.5">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
