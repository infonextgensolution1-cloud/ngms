export const metadata = {
  alternates: { canonical: '/about' },
  title: 'About NextGen | Property Maintenance, One Call',
  description:
    'Meet NextGen Solar Clean & Maintenance Solutions. Solar panel cleaning and multi-trade property maintenance across Strand, Gordon’s Bay and Somerset West.',
}

const services = [
  ['01', 'Solar panel cleaning', 'Specialist cleaning to help keep your solar array clear of built-up dirt and seasonal residue.'],
  ['02', 'Painting & waterproofing', 'Interior and exterior refreshes, roof protection and practical weatherproofing.'],
  ['03', 'Paving & exterior care', 'Hard-wearing paving, high-pressure cleaning, gutters and outdoor maintenance.'],
  ['04', 'Plumbing & electrical', 'Property repairs coordinated through one point of contact.'],
  ['05', 'Pool fibre lining', 'Pool surface renewal and maintenance support.'],
  ['06', 'Steelwork, rubble & handyman', 'The finishing work and practical fixes that keep a property moving.'],
]

const principles = [
  ['ONE POINT OF CONTACT', 'A clear route from first enquiry to completed job.'],
  ['WRITTEN QUOTES', 'Scope and pricing set out before work begins.'],
  ['LOCAL & ACCOUNTABLE', 'Serving Strand, Gordon’s Bay and Somerset West.'],
  ['PRACTICAL CRAFT', 'Work planned around the property, not a one-size-fits-all template.'],
]

export default function AboutPage() {
  return (
    <main className="ngms-about-editorial">
      <section className="ngms-about-services" aria-labelledby="about-services-title">
        <div className="ngms-about-services-intro">
          <div>
            <p className="ngms-about-eyebrow">NEXTGEN MAINTENANCE SOLUTIONS / 01</p>
            <h1 id="about-services-title">ONE CALL.<br />ALL SOLUTIONS.</h1>
            <p className="ngms-about-smallcopy">Solar panel cleaning first. Multi-trade property maintenance, all under one point of contact.</p>
          </div>
          <a className="ngms-about-round-link" href="/services" aria-label="Explore all services">↘</a>
        </div>
        <div className="ngms-about-service-list">
          {services.map(([number, title, description]) => (
            <a className="ngms-about-service-row" href="/services" key={number}>
              <span className="ngms-about-service-number">{number}</span>
              <span className="ngms-about-service-copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <span className="ngms-about-service-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="ngms-about-proof" aria-labelledby="about-proof-title">
        <div className="ngms-about-proof-top">
          <span className="ngms-about-scrollmark" aria-hidden="true">← ··· →</span>
          <div>
            <p className="ngms-about-eyebrow">HOW WE WORK / 02</p>
            <h2 id="about-proof-title">GOOD WORK.<br />CLEAR COMMUNICATION.</h2>
            <p>Delivered with attention to detail, respect for your property and a straightforward process.</p>
          </div>
        </div>
        <div className="ngms-about-principles">
          {principles.map(([title, copy], index) => (
            <article className="ngms-about-principle" key={title}>
              <span className="ngms-about-principle-index">0{index + 1} / NGMS</span>
              <span className="ngms-about-principle-mark" aria-hidden="true">✳</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ngms-about-owner">
        <div className="ngms-about-owner-copy">
          <p className="ngms-about-eyebrow">THE PERSON BEHIND THE WORK / 03</p>
          <h2>BUILT ON<br />ACCOUNTABILITY.</h2>
          <p>NextGen was founded by Jacques Gordon to give property owners a reliable contractor to call. Solar panel cleaning is our specialist service, backed by a broad range of maintenance trades—so you can coordinate more of the work with less runaround.</p>
          <p>From the first conversation to the finished job, the goal is simple: clear scope, practical workmanship and a property left in good order.</p>
          <a className="ngms-about-text-link" href="/quote">MEET YOUR NEXTGEN CONTACT <span>↗</span></a>
        </div>
        <div className="ngms-about-owner-image">
          <img src="/jacques-gordon.webp" alt="Jacques Gordon, owner and project manager of NextGen" width={720} height={900} loading="lazy" />
          <span className="ngms-about-image-caption">JACQUES GORDON / OWNER & PROJECT MANAGER</span>
          <span className="ngms-about-image-stamp" aria-hidden="true">NG<br />MS</span>
        </div>
      </section>

      <section className="ngms-about-areas">
        <p>LOCAL KNOW-HOW <span>✳</span> PRACTICAL SOLUTIONS <span>✳</span> ONE POINT OF CONTACT <span>✳</span></p>
        <p>Based in the Helderberg Basin, serving Strand, Gordon’s Bay and Somerset West. Work outside the Helderberg Basin may carry a R350 callout fee.</p>
      </section>

      <section className="ngms-about-contact" aria-labelledby="about-contact-title">
        <div className="ngms-about-contact-top">
          <span className="ngms-about-eyebrow">HAVE A PROPERTY PROJECT?</span>
          <span className="ngms-about-contact-dot" aria-hidden="true">✳</span>
          <h2 id="about-contact-title">ANYTHING IN<br />MIND? LET’S TALK.</h2>
          <a className="ngms-about-talk-button" href="/quote">TELL US WHAT YOU NEED <span>↗</span></a>
        </div>
        <div className="ngms-about-contact-word" aria-hidden="true">CONTACT<span></span></div>
      </section>

      <footer className="ngms-about-footer">
        <div className="ngms-about-footer-brand">
          <a href="/" className="ngms-about-logo">NEXTGEN<span> / NGMS</span></a>
          <p>ONE CALL.<br />ALL SOLUTIONS.</p>
          <div className="ngms-about-socials">
            <a href="https://wa.me/27631387945" aria-label="WhatsApp NextGen">WA ↗</a>
            <a href="https://www.facebook.com/" aria-label="Facebook">FB ↗</a>
          </div>
        </div>
        <div className="ngms-about-footer-portrait">
          <img src="/jacques-gordon.webp" alt="" width={720} height={900} loading="lazy" />
          <span>HELDERVBERG BASIN<br />WESTERN CAPE / SOUTH AFRICA</span>
        </div>
        <div className="ngms-about-footer-links">
          <p>START A CONVERSATION</p>
          <a href="/quote">REQUEST A QUOTE ↗</a>
          <a href="https://wa.me/27631387945">WHATSAPP ↗</a>
          <a href="/services">OUR SERVICES ↗</a>
          <div className="ngms-about-footer-nav">
            <a href="/">HOME</a><a href="/about">ABOUT</a><a href="/services">SERVICES</a><a href="/contact">CONTACT</a>
          </div>
          <small>© {new Date().getFullYear()} NEXTGEN MAINTENANCE SOLUTIONS</small>
        </div>
      </footer>
    </main>
  )
}
