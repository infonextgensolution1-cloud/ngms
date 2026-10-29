import type { ReactNode } from "react";
import Link from "next/link";
import { publicNav, site } from "@/lib/site";
import { LOGO_DATA_URI } from "@/lib/logo";

export function Brand() {
  return <Link href="/" className="brand" aria-label="NGMS — home"><img src={LOGO_DATA_URI} alt="" width={160} height={56} className="brand-logo" /></Link>;
}
export function PublicShell({children,active}:{children:ReactNode;active?:string}) {
  return <div className="public-app">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="site-header-inner"><Brand/><nav className="desktop-nav" aria-label="Main navigation">{publicNav.map((item)=><Link key={item.href} href={item.href} aria-current={active===item.href?"page":undefined}>{item.label}</Link>)}</nav><Link className="button button-orange header-cta" href="/quote">Get a quote <span aria-hidden="true">↗</span></Link></div><nav className="mobile-nav" aria-label="Mobile navigation">{publicNav.slice(0,4).map((item)=><Link key={item.href} href={item.href} aria-current={active===item.href?"page":undefined}>{item.label}</Link>)}</nav></header>
    {children}
    <footer className="site-footer"><div className="footer-main"><div><Brand/><p className="footer-tagline">One local point of contact for property maintenance.</p></div><div><p className="footer-label">EXPLORE</p><Link href="/services">All services</Link><Link href="/portfolio">Project gallery</Link><Link href="/maintenance-packages">Maintenance plans</Link></div><div><p className="footer-label">GET IN TOUCH</p><a href={"tel:"+site.phoneHref}>{site.phoneDisplay}</a><a href={site.whatsappHref} target="_blank" rel="noreferrer">WhatsApp NGMS ↗</a><Link href="/quote">Request a quotation</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {site.name}</span><span>Western Cape, South Africa · ZAR</span><span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span></div></footer>
    <a className="mobile-quick-cta" href={site.whatsappHref} target="_blank" rel="noreferrer">WhatsApp NGMS <span aria-hidden="true">↗</span></a>
  </div>;
}
export function PageIntro({eyebrow,title,intro}:{eyebrow:string;title:string;intro:string}) {return <section className="page-intro"><div className="container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-intro-copy">{intro}</p></div></section>;}
export function CTASection({title="Let's get the job moving.",text="Tell us what needs doing and NGMS can review the scope."}:{title?:string;text?:string}) {return <section className="cta-section cta-dark"><div className="container cta-inner"><div><p className="eyebrow">NEXT STEP</p><h2>{title}</h2><p>{text}</p></div><div className="cta-actions"><Link className="button button-orange" href="/quote">Request a quote ↗</Link><a className="button button-outline" href={site.whatsappHref} target="_blank" rel="noreferrer">WhatsApp a photo</a></div></div></section>;}
