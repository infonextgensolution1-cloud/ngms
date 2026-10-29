import type { Metadata } from "next";
import { PageIntro, PublicShell } from "@/components/PublicShell";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "Maintenance plan", robots: { index: false, follow: false } };
export default async function MaintenanceTokenPage({ params }: { params: Promise<{ token: string }> }) {
  await params; // Do not log, render, or disclose the supplied token.
  return <PublicShell><main id="main-content"><PageIntro eyebrow="NGMS / MAINTENANCE PLAN" title={"MAINTENANCE.\nMADE CLEAR."} intro="The plan activation route is preserved, but live activation and account lookups are not enabled in this rebuild preview."/><section className="page-section"><div className="container prose-panel"><h2>THIS LINK IS NOT ACTIVE IN THE REBUILD.</h2><p>Use the original approved link on the current NGMS website or contact NGMS for help. Do not forward private activation links publicly.</p><div className="contact-actions"><a className="button button-orange" href={site.domain} target="_blank" rel="noreferrer">Open current NGMS website ↗</a><a className="button button-outline button-dark-outline" href={"tel:"+site.phoneHref}>Call {site.phoneDisplay}</a></div><p>No plan state or customer information has been read or changed.</p></div></section></main></PublicShell>;
}
