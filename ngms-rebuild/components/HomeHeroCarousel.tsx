"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

export type HeroCarouselSlide={
 id:string;
 eyebrow:string;
 title:string;
 description:string;
 button_label:string;
 button_url:string;
 url:string;
 alt_text:string;
};
export default function HomeHeroCarousel({slides,fallbackImage}:{slides:HeroCarouselSlide[];fallbackImage:string}){
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const hasSlides=slides.length>0;
 const active=hasSlides?slides[index%slides.length]:null;
 useEffect(()=>{
  if(!hasSlides||paused||slides.length<2)return;
  const timer=window.setInterval(()=>setIndex(current=>(current+1)%slides.length),6500);
  return()=>window.clearInterval(timer);
 },[hasSlides,paused,slides.length]);
 const move=(direction:number)=>{
  if(!hasSlides)return;
  setIndex(current=>(current+direction+slides.length)%slides.length);
  setPaused(true);
 };
 const safeHref=active?.button_url||"/quote";
 return <div className="solar-art hero-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
  <img className="hero-solar-image" src={active?.url||fallbackImage} alt={active?.alt_text||"NGMS property maintenance and solar cleaning"} fetchPriority="high"/>
  {active&&<div className="hero-carousel-caption">
   {active.eyebrow&&<p>{active.eyebrow}</p>}
   <strong>{active.title}</strong>
   {active.description&&<span>{active.description}</span>}
   <Link href={safeHref}>{active.button_label} ↗</Link>
  </div>}
  <div className="hero-carousel-controls" aria-label="Homepage featured slides">
   {hasSlides&&<><button type="button" onClick={()=>move(-1)} aria-label="Previous slide">‹</button><span>{String(index+1).padStart(2,"0")} / {String(slides.length).padStart(2,"0")}</span><button type="button" onClick={()=>move(1)} aria-label="Next slide">›</button></>}
   {slides.length>1&&<button type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?"Resume carousel":"Pause carousel"}>{paused?"Play":"Pause"}</button>}
  </div>
 </div>;
}
