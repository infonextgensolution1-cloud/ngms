import type { Metadata } from "next";
import { PageIntro, PublicShell } from "@/components/PublicShell";
import QuotePublicDecisionClient from "@/components/QuotePublicDecisionClient";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Quotation", robots: { index: false, follow: false } };

export default async function QuoteTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return <PublicShell><main id="main-content"><PageIntro eyebrow="NGMS / QUOTATION" title="YOUR QUOTE LINK." intro="This quotation link is not valid. Contact NGMS to request a fresh link."/><section className="page-section"><div className="container prose-panel"><p>For assistance, visit the NGMS website or call the team.</p><div className="contact-actions"><a className="button button-orange" href={site.domain} target="_blank" rel="noreferrer">Open NGMS website ↗</a><a className="button button-outline button-dark-outline" href={"tel:"+site.phoneHref}>Call {site.phoneDisplay}</a></div></div></section></main></PublicShell>;
  }
  return <PublicShell><main id="main-content"><PageIntro eyebrow="NGMS / QUOTATION" title={"YOUR QUOTE.\nCLEAR NEXT STEPS."} intro="Review your itemised quotation and record your decision using this secure, one-use link."/><QuotePublicDecisionClient token={token}/></main></PublicShell>;
}
