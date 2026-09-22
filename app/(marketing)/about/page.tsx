import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "One Call, All Solutions — who we are and how NGSMS works.",
};

export default function AboutPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">About {SITE.shortName}</p>
        <h1 className="text-3xl md:text-5xl">One Call, All Solutions</h1>
      </div>
      <div className="wrap max-w-[720px] py-10">
        <p className="text-mist leading-relaxed">
          {SITE.name} was built so property owners shouldn&rsquo;t need a different contractor for every job.
          From solar panel cleaning to painting, waterproofing, paving, plumbing, electrical work and more — one
          coordinated point of contact for every trade across the Helderberg Basin, and now the greater Overberg too.
        </p>
        <p className="text-mist leading-relaxed mt-4">
          Owned and run by Jacques Gordon, who leads every project hands-on as owner, project manager and
          contractor — previously managing maintenance teams at Swift Pool Company and as a foreman at Liebcon
          Construction.
        </p>
      </div>
      <section className="py-14 px-4 bg-graphite border-t border-line">
        <div className="wrap">
          <h2 className="text-left mb-6 text-2xl">Your Point of Contact</h2>
          <div className="card max-w-[420px]">
            <h3 className="text-lg">Jacques Gordon</h3>
            <p className="tag">Owner, Project Manager &amp; Contractor</p>
            <p className="text-mist text-sm mt-2.5">
              Leads every project hands-on, from the first site visit to the final sign-off — one point of contact
              across all trades.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}
