import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";
import WhatsAppQuoteCTA from "@/components/WhatsAppQuoteCTA";

export const metadata: Metadata = {
  title: "Get a Free Quote | NextGen Solar Clean & Maintenance",
  description: "Request a free quote from NextGen Solar Clean & Maintenance Solutions — upload a photo, get an instant guide price, and we reply the same day.",
  alternates: { canonical: "/quote" },
  openGraph: {
    title: "Get a Free Quote | NextGen Solar Clean & Maintenance",
    description: "Photo quote with instant guide price. Solar panel cleaning from R550. Strand, Gordon's Bay, Somerset West.",
    url: "/quote",
  },
};

export default function QuotePage({
  searchParams,
}: {
  searchParams: { service?: string; area?: string; size?: string };
}) {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Get Started</p>
        <h1 className="text-3xl md:text-5xl">Request a Free Quote</h1>
        <p className="text-mist mt-2">We reply the same day — usually within a few hours.</p>
      </div>
      <div className="wrap py-10 grid gap-8">
        <WhatsAppQuoteCTA />
        <div className="max-w-[520px] mx-auto w-full flex items-center gap-3 text-mist text-xs uppercase tracking-wider">
          <span className="h-px flex-1 bg-line" />
          Or fill in the form
          <span className="h-px flex-1 bg-line" />
        </div>
        <QuoteForm
          initialService={searchParams.service}
          initialArea={searchParams.area}
          initialSize={searchParams.size}
        />
      </div>
    </section>
  );
}
