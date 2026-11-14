import type {Metadata} from "next";
import {PageIntro,PublicShell,CTASection} from "@/components/PublicShell";
import {getPublishedProjects} from "@/lib/server/public-media";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Before & After Projects",description:"See before-and-after property maintenance projects published by NGMS."};

export default async function BeforeAfterPage(){
 const projects=await getPublishedProjects();
 return <PublicShell><main id="main-content">
  <PageIntro eyebrow="NGMS / PROJECT RESULTS" title={"BEFORE.\nAFTER.\nDONE RIGHT."} intro="Explore published before-and-after project photographs from the NGMS team. Images are displayed only after project approval."/>
  <section className="page-section"><div className="container">
   {projects.filter(project=>project.before.length>0||project.after.length>0).length?
    <div className="ngms-project-grid">{projects.filter(project=>project.before.length>0||project.after.length>0).map(project=><article key={project.id} className="ngms-project-card"><p className="eyebrow">{project.service} / {project.location}</p><h2>{project.title}</h2><div className="ngms-before-after-grid"><div><span className="ngms-photo-label">BEFORE</span><div className="ngms-photo-strip">{project.before.map(photo=><figure key={photo.id}><img src={photo.url} alt={photo.alt_text} loading="lazy"/></figure>)}</div></div><div><span className="ngms-photo-label">AFTER</span><div className="ngms-photo-strip">{project.after.map(photo=><figure key={photo.id}><img src={photo.url} alt={photo.alt_text} loading="lazy"/></figure>)}</div></div></div>{project.description&&<p className="ngms-project-description">{project.description}</p>}</article>)}</div>
    :<div className="prose-panel"><h2>BEFORE-AND-AFTER PROJECTS WILL APPEAR HERE.</h2><p>NGMS will publish authentic project photographs once a project has been reviewed and approved.</p></div>}
  </div></section><CTASection/>
 </main></PublicShell>;
}
