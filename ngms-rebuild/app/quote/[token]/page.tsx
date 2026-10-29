import type { Metadata } from "next";
import { PageIntro, PublicShell } from "@/components/PublicShell";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "Quotation", robots: { index: false, follow: false } };
export default async function QuoteTokenPage({ params }: { params: Promise<{ token: string }> }) {
  await params; // Do not log, render, or disclose the supplied token.
  return <PublicShell><main id="main-content"><PageIntro eyebrow="NGMS / QUOTATION" title={"YOUR QUOTE.\nCLEAR NEXT STEPS."} intro="The quote-link route is preserved, but private quotation retrieval and customer decisions are not connected in this rebuild preview."/><section className="page-section"><div className="container prose-panel"><h2>THIS QUOTE LINK IS NOT ACTIVE IN THE REBUILD.</h2><p>Open your original quotation link on the current NGMS website or contact NGMS for assistance. A quotation token should be treated as private.</p><div className="contact-actions"><a className="button button-orange" href={site.domain} target="_blank" rel="noreferrer">Open current NGMS website ↗</a><a className="button button-outline button-dark-outline" href={"tel:"+site.phoneHref}>Call {site.phoneDisplay}</a></div><p>No quote details have been retrieved, accepted, declined or changed.</p></div></section></main></PublicShell>;
}
