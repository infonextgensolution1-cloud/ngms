import type { Metadata } from "next";
import { PageIntro, PublicShell } from "@/components/PublicShell";
import { site } from "@/lib/site";
import QuoteRequestForm from "@/components/QuoteRequestForm";

export const metadata: Metadata = {
  title: "Request a Quote | NextGen Maintenance Solutions",
  description: "Request a property maintenance quotation from NGMS across the Helderberg and surrounding Western Cape areas.",
};

export default function QuotePage() {
  return (
    <PublicShell>
      <main id="main-content">
        <PageIntro
          eyebrow="QUOTE REQUEST"
          title={"TELL US WHAT\nNEEDS DOING."}
          intro="Share the service, property location and work required. Your request is sent to the NGMS team for review before a formal quotation is prepared."
        />
        <section className="page-section">
          <div className="container form-layout">
            <QuoteRequestForm />
            <aside className="form-aside">
              <p className="eyebrow">WHAT HAPPENS NEXT</p>
              <h2>FROM REQUEST<br />TO QUOTATION.</h2>
              <ol className="quote-next-steps">
                <li><strong>01 / REQUEST RECEIVED</strong><span>Your enquiry is recorded and given a reference.</span></li>
                <li><strong>02 / NGMS REVIEW</strong><span>An administrator checks the details and may contact you for more information.</span></li>
                <li><strong>03 / WRITTEN QUOTE</strong><span>NGMS prepares a scope and pricing for your approval.</span></li>
              </ol>
              <a className="button button-orange" href={site.whatsappHref} target="_blank" rel="noreferrer">WhatsApp NGMS ↗</a>
              <a className="button button-outline button-dark-outline" href={"tel:" + site.phoneHref}>Call {site.phoneDisplay}</a>
              <small>For urgent maintenance requests, contact NGMS directly. The preview form does not accept photo attachments yet.</small>
            </aside>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
