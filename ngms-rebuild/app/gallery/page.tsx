import type {Metadata} from "next";
import {PageIntro,PublicShell,CTASection} from "@/components/PublicShell";
import {getPublishedMedia} from "@/lib/server/public-media";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"NGMS Photo Gallery",description:"Published NGMS service and project photographs."};

export default async function GalleryPage(){
 const media=await getPublishedMedia();
 return <PublicShell><main id="main-content">
  <PageIntro eyebrow="NGMS / PHOTO GALLERY" title={"SERVICES.\nPROJECTS.\nRESULTS."} intro="Photographs published by the NGMS team from the central media library."/>
  <section className="page-section"><div className="container">
   {media.length?<div className="published-media-grid">{media.map(item=><figure key={item.id}><img src={item.url} alt={item.alt_text} loading="lazy"/><figcaption>{item.category}</figcaption></figure>)}</div>:<div className="prose-panel"><h2>THE GALLERY IS BEING UPDATED.</h2><p>New photographs will appear here after the NGMS team uploads, categorises and publishes them in the Media Manager.</p></div>}
  </div></section><CTASection/>
 </main></PublicShell>;
}
