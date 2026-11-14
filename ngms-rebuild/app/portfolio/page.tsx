import type {Metadata} from "next";
import {PageIntro,PublicShell,CTASection} from "@/components/PublicShell";
import {getPublishedProjects,getPublishedMedia} from "@/lib/server/public-media";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Portfolio & Project Gallery",description:"Published project photographs and before-and-after results from NextGen Maintenance Solutions."};

export default async function PortfolioPage(){
 const [projects,media]=await Promise.all([getPublishedProjects(),getPublishedMedia()]);
 const unassigned=media.filter(item=>["Project Photos","Portfolio","Body Corporate Projects"].includes(item.category));
 return <PublicShell active="/portfolio"><main id="main-content">
  <PageIntro eyebrow="NGMS / PROJECT PORTFOLIO" title={"REAL WORK.\nCLEAR EVIDENCE."} intro="Browse project photographs approved by NGMS. Projects and photographs are managed through the central Media Manager."/>
  <section className="page-section"><div className="container">
   {projects.length>0?<div className="ngms-project-grid">{projects.map(project=><article key={project.id} className="ngms-project-card">
    <div className="ngms-project-card-head"><div><p className="eyebrow">{project.service}</p><h2>{project.title}</h2><p>{project.location}{project.completed_at?" · "+new Date(project.completed_at).toLocaleDateString("en-ZA",{month:"short",year:"numeric"}):""}</p></div></div>
    {project.before.length>0||project.after.length>0?<div className="ngms-before-after-grid">
     <div><span className="ngms-photo-label">BEFORE</span><div className="ngms-photo-strip">{project.before.map(photo=><figure key={photo.id}><img src={photo.url} alt={photo.alt_text} loading="lazy"/></figure>)}</div></div>
     <div><span className="ngms-photo-label">AFTER</span><div className="ngms-photo-strip">{project.after.map(photo=><figure key={photo.id}><img src={photo.url} alt={photo.alt_text} loading="lazy"/></figure>)}</div></div>
    </div>:null}
    {project.general.length>0&&<div className="ngms-photo-strip ngms-photo-strip--general">{project.general.map(photo=><figure key={photo.id}><img src={photo.url} alt={photo.alt_text} loading="lazy"/></figure>)}</div>}
    {project.description&&<p className="ngms-project-description">{project.description}</p>}
   </article>)}</div>:<div className="prose-panel"><h2>PROJECT PHOTOGRAPHS ARE BEING PREPARED.</h2><p>Approved NGMS project photographs will appear here once they have been categorised and published in the Project Manager.</p></div>}
   {unassigned.length>0&&<div className="published-media-grid mt-8">{unassigned.map(item=><figure key={item.id}><img src={item.url} alt={item.alt_text} loading="lazy"/><figcaption>{item.category}</figcaption></figure>)}</div>}
  </div></section><CTASection title="Have a project in mind?" text="Contact NGMS to discuss your maintenance requirements."/>
 </main></PublicShell>;
}
