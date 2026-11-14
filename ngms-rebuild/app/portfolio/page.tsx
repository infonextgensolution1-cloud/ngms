import type {Metadata} from "next";
import {PageIntro,PublicShell,CTASection} from "@/components/PublicShell";
import {getPublishedMedia} from "@/lib/server/public-media";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Portfolio & Project Gallery",description:"Published project photographs from NextGen Maintenance Solutions."};

export default async function PortfolioPage(){
 const media=await getPublishedMedia();
 const projects=media.filter(item=>["Project Photos","Portfolio","Before & After","Body Corporate Projects"].includes(item.category));
 return <PublicShell active="/portfolio"><main id="main-content">
  <PageIntro eyebrow="NGMS / PROJECT PORTFOLIO" title={"REAL WORK.
CLEAR EVIDENCE."} intro="Browse project photographs approved by NGMS. Each published image is managed through the central Media Manager."/>
  <section className="page-section"><div className="container">
   {projects.length?<div className="published-media-grid">{projects.map(item=><figure key={item.id}><img src={item.url} alt={item.alt_text} loading="lazy"/><figcaption>{item.category}</figcaption></figure>)}</div>:<div className="prose-panel"><h2>PROJECT PHOTOGRAPHS ARE BEING PREPARED.</h2><p>Approved NGMS project photographs will appear here once they have been categorised and published in the Media Manager.</p></div>}
  </div></section><CTASection title="Have a project in mind?" text="Contact NGMS to discuss your maintenance requirements."/>
 </main></PublicShell>;
}
