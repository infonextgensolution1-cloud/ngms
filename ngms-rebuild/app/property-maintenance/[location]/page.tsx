import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CTASection, PageIntro, PublicShell } from "@/components/PublicShell";
import { site } from "@/lib/site";

const areas: Record<string, { name: string; description: string }> = {
  strand: { name: "Strand", description: "Property maintenance enquiries for homes, complexes and businesses in Strand. Confirm exact scope and availability with NGMS." },
  "gordons-bay": { name: "Gordon's Bay", description: "Property maintenance enquiries for homes, complexes and businesses in Gordon's Bay. Confirm exact scope and availability with NGMS." },
  "somerset-west": { name: "Somerset West", description: "Property maintenance enquiries for homes, complexes and businesses in Somerset West. Confirm exact scope and availability with NGMS." }
};
export function generateStaticParams() { return Object.keys(areas).map((location) => ({ location })); }
export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const { location } = await params;
  const area = areas[location];
  return { title: area ? "Property Maintenance — " + area.name : "Property Maintenance", description: area?.description ?? "NGMS property maintenance enquiries." };
}
export default async function PropertyAreaPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const area = areas[location];
  if (!area) notFound();
  return <PublicShell><main id="main-content"><PageIntro eyebrow={"PROPERTY MAINTENANCE / " + area.name.toUpperCase()} title={"LOCAL SERVICE.\nCLEAR NEXT STEPS."} intro={area.description} /><section className="page-section"><div className="container detail-grid"><div className="detail-panel"><p className="eyebrow">SCOPE YOUR REQUEST</p><h2>WHAT NEEDS<br/><span>ATTENTION?</span></h2><p>Describe the property, required service, site access and preferred timing. Availability, travel and pricing are confirmed for each request.</p><Link className="button button-orange" href="/quote">Request a quote ↗</Link></div><aside className="detail-aside"><span className="big-number">NGMS / AREA</span><h3>{area.name}<br/>and surrounds.</h3><p>{site.serviceArea}</p><p>Service coverage and timing must be confirmed for the particular job.</p></aside></div></section><CTASection title={"PROPERTY MAINTENANCE IN " + area.name.toUpperCase()} text="Share the job details so NGMS can review the scope."/></main></PublicShell>;
}
