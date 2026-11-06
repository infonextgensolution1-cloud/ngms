import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {CTASection,PageIntro,PublicShell} from "@/components/PublicShell";
import {site} from "@/lib/site";
import QuoteRequestForm from "@/components/QuoteRequestForm";
const content:Record<string,{title:string;eyebrow:string;intro:string;paragraphs:string[]}>={
 about:{title:"LOCAL SERVICE.\nCLEAR NEXT STEPS.",eyebrow:"ABOUT NGMS",intro:"NextGen Maintenance Solutions supports property maintenance and solar cleaning requests across the Helderberg and surrounding Western Cape areas.",paragraphs:["The goal is to make maintenance easier through clear scope, communication and an agreed next step.","Specific capacity, credentials, warranties and project outcomes must be confirmed before being published as claims."]},
 contact:{title:"LET'S TALK\nABOUT THE JOB.",eyebrow:"CONTACT NGMS",intro:"Share your contact details, choose the service and property area, and describe the work. NGMS will review your request and confirm the next step.",paragraphs:["Phone: "+site.phoneDisplay,"Service area: "+site.serviceArea]},
 portfolio:{title:"WORK THAT\nSPEAKS FOR ITSELF.",eyebrow:"PROJECT GALLERY",intro:"The gallery should show authentic, approved NGMS work and accurately caption each project.",paragraphs:["No project records or approved media are connected to this isolated rebuild yet.","Only genuine, approved project imagery will be published after media inventory and storage integration."]},
 "maintenance-packages":{title:"PLANNED CARE.\nFEWER SURPRISES.",eyebrow:"MAINTENANCE PLANS",intro:"Explore a recurring maintenance arrangement for your property or site.",paragraphs:["Plan scope, visit cadence, exclusions, response expectations and current pricing must be confirmed with NGMS before a package is accepted.","Request an assessment to discuss site requirements and service frequency."]},
 "body-corporate-maintenance":{title:"ONE PARTNER FOR\nSHARED SPACES.",eyebrow:"BODY CORPORATES",intro:"A clear maintenance pathway for trustees, managing agents and property managers.",paragraphs:["Describe the property, shared areas, recurring tasks and reporting requirements so a practical scope can be assessed.","Schedules, service levels and pricing should be agreed in writing for each property."]},
 "price-list":{title:"CLEAR SCOPE.\nCLEAR PRICING.",eyebrow:"PRICING",intro:"Request pricing for the actual work required at your property.",paragraphs:["A verified, current price catalogue has not been connected to this rebuild, so unverified rates are not published here.","A quotation should identify scope, travel or assessment charges where applicable, materials, exclusions and payment terms."]},
 gallery:{title:"PROJECTS.\nBEFORE AND AFTER.",eyebrow:"GALLERY",intro:"The gallery should show only authentic, approved NGMS project imagery with accurate captions.",paragraphs:["No approved gallery records or R2 media references are connected to this rebuild yet.","The legacy /gallery route is retained; live image browsing will be enabled only after media references, permissions and image delivery are verified."]},
 "roi-calculator":{title:"UNDERSTAND THE\nCLEANING VALUE.",eyebrow:"SOLAR ROI",intro:"A calculator is useful only when its assumptions are clear and calculations are checked against the intended use case.",paragraphs:["The interactive ROI calculation has not yet been migrated or verified in this rebuild. No estimated savings or performance values are generated here.","Until the formula, units, assumptions and output wording are validated, use the current live website for its existing calculator."]},
 faq:{title:"COMMON\nQUESTIONS.",eyebrow:"HELP & INFORMATION",intro:"Answers should reflect the actual service scope and confirmed operating process.",paragraphs:["How do I request a quote? Contact NGMS by WhatsApp or phone, or use the quote request on the current live website.","Are all service prices fixed? No universal price list is asserted here. Scope, access, materials and location may affect the quotation.","Can I upload photos? Use a current approved contact channel until the new media upload API is connected."]},
 privacy:{title:"PRIVACY\n& YOUR DATA.",eyebrow:"PRIVACY NOTICE",intro:"This rebuild preview may accept test enquiries into isolated preview systems. Use synthetic test details only until NGMS approves the production release.",paragraphs:["The final privacy notice must be reviewed against the actual data controller, service providers, retention period, security controls and POPIA processes before production launch.","Do not submit identity numbers, financial details, passwords or sensitive personal information through the preview enquiry form. This draft is not legal advice or a replacement for an approved policy."]},
 terms:{title:"SERVICE TERMS\n& CONDITIONS.",eyebrow:"TERMS",intro:"The terms that apply to a job must be supplied and approved before launch.",paragraphs:["This design preview does not create new commercial terms, warranties, cancellation policy or payment terms.","Use the terms stated in the current approved quotation or agreement until a reviewed terms page is published."]}
};
export function generateStaticParams(){return Object.keys(content).map((page)=>({page}));}
export async function generateMetadata({params}:{params:Promise<{page:string}>}):Promise<Metadata>{const {page}=await params;return {title:content[page]?.eyebrow??"NGMS"};}
export default async function InfoPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const c = content[page];
  if (!c) notFound();

  return (
    <PublicShell active={"/" + page}>
      <main id="main-content">
        <PageIntro eyebrow={c.eyebrow} title={c.title} intro={c.intro} />
        <section className="page-section">
          {page === "contact" ? (
            <div className="container form-layout">
              <QuoteRequestForm />
              <aside className="form-aside">
                <p className="eyebrow">WHAT HAPPENS NEXT</p>
                <h2>FROM ENQUIRY<br />TO QUOTATION.</h2>
                <ol className="quote-next-steps">
                  <li><strong>01 / REQUEST RECEIVED</strong><span>Your details and job description are submitted securely and given a reference.</span></li>
                  <li><strong>02 / NGMS REVIEW</strong><span>Our team checks the service, suburb and work required. We may contact you for more information.</span></li>
                  <li><strong>03 / WRITTEN QUOTE</strong><span>We prepare a written scope and quotation for your review.</span></li>
                </ol>
                <a className="button button-orange" href={site.whatsappHref} target="_blank" rel="noreferrer">WhatsApp NGMS ↗</a>
                <a className="button button-outline button-dark-outline" href={"tel:" + site.phoneHref}>Call {site.phoneDisplay}</a>
                <small>This preview form writes to isolated test data, not the live production inbox. Use synthetic test details only until production intake is approved. For current service requests, contact NGMS directly.</small>
              </aside>
            </div>
          ) : (
            <div className="container prose-panel">
              {c.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              {page === "portfolio" && (
                <div className="empty-gallery">
                  <span aria-hidden="true">▧</span>
                  <h2>APPROVED PROJECTS WILL APPEAR HERE.</h2>
                  <p>Authentic project imagery only. Media integration is part of the next phase.</p>
                </div>
              )}
              <Link className="text-link" href="/quote">REQUEST A QUOTE ↗</Link>
            </div>
          )}
        </section>
        <CTASection />
      </main>
    </PublicShell>
  );
}
