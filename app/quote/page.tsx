import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Get A Free Quote",
  description: "Request a free quote from NextGen Solar & Maintenance Solutions — we reply the same day.",
};

export default function QuotePage({ searchParams }: { searchParams: { service?: string } }) {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Get Started</p>
        <h1 className="text-3xl md:text-5xl">Request a Free Quote</h1>
        <p className="text-mist mt-2">We reply the same day — usually within a few hours.</p>
      </div>
      <div className="wrap py-10">
        <QuoteForm initialService={searchParams.service} />
      </div>
    </section>
  );
}
