import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PublicShell } from "@/components/PublicShell";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "Job tracking", robots: { index: false, follow: false } };
export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  await params; // Do not log, render, or disclose the supplied token.
  return <PublicShell><main id="main-content"><PageIntro eyebrow="NGMS / JOB TRACKING" title={"YOUR JOB STATUS.\nONE PLACE."} intro="The tracking route is preserved, but live status lookups are not connected in this rebuild preview."/><section className="page-section"><div className="container prose-panel"><h2>TRACKING IS NOT ACTIVE IN THIS PREVIEW.</h2><p>For an existing job link, use the current NGMS website or contact NGMS directly. Do not share a private tracking link publicly.</p><div className="contact-actions"><a className="button button-orange" href={site.domain} target="_blank" rel="noreferrer">Open current NGMS website ↗</a><a className="button button-outline button-dark-outline" href={"tel:"+site.phoneHref}>Call {site.phoneDisplay}</a></div><p>No job status or customer data has been looked up.</p></div></section></main></PublicShell>;
}
