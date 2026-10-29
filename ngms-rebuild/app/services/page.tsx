import type { Metadata } from "next";
import Link from "next/link";
import {CTASection,PageIntro,PublicShell} from "@/components/PublicShell";
import {services} from "@/lib/site";
export const metadata:Metadata = {title:"Services",description:"Explore NGMS property maintenance and solar cleaning services."};
export default function ServicesPage(){return <PublicShell active="/services"><main id="main-content"><PageIntro eyebrow="NGMS SERVICE DIRECTORY" title={"ONE TEAM.\nMANY SOLUTIONS."} intro="Explore the current NGMS service categories. The exact scope, availability and pricing are confirmed for each request."/><section className="page-section"><div className="container"><div className="service-grid service-grid-all">{services.map((s,i)=><Link className="service-card" href={"/services/"+s.slug} key={s.slug}><div className="service-card-top"><span>{String(i+1).padStart(2,"0")}</span><span>↗</span></div><h3>{s.name}</h3><p>{s.tagline}</p><span className="service-card-link">VIEW SERVICE ↗</span></Link>)}</div></div></section><CTASection/></main></PublicShell>;}
