import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageIntro, PublicShell } from "@/components/PublicShell";
import QuoteDecisionClient from "@/components/QuoteDecisionClient";

export const metadata: Metadata = {
  title: "Private quotation",
  robots: { index: false, follow: false },
};

export default async function QuoteTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/i.test(token)) notFound();

  return <PublicShell>
    <main id="main-content">
      <PageIntro
        eyebrow="NGMS / PRIVATE QUOTATION"
        title={"YOUR QUOTE.\nCLEAR NEXT STEPS."}
        intro="Review the itemised work and total below. You can accept or decline this quotation securely."
      />
      <QuoteDecisionClient token={token} />
    </main>
  </PublicShell>;
}
