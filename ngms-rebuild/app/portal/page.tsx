import type {Metadata} from "next";
import Link from "next/link";
import {PublicShell,PageIntro} from "@/components/PublicShell";

export const metadata:Metadata={title:"Customer Portal",robots:{index:false,follow:false}};

export default function PortalLandingPage(){
 return <PublicShell><main id="main-content">
  <PageIntro eyebrow="NGMS / CUSTOMER PORTAL" title={"YOUR PROPERTY.\nYOUR SERVICE HISTORY."} intro="Use the secure access link supplied by NGMS to view your quotations, invoices, scheduled jobs and maintenance plan status."/>
  <section className="page-section"><div className="container"><div className="prose-panel"><h2>ACCESS YOUR CUSTOMER WORKSPACE.</h2><p>Customer portal links are private, time-limited and linked to one customer account. If your access link has expired or you need a new one, contact the NGMS team.</p><Link className="button button-orange" href="/contact">Contact NGMS ↗</Link></div></div></section>
 </main></PublicShell>;
}
