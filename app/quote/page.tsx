'use client'

import { useState } from 'react'
import { services } from '@/lib/services'
import { supabase } from '@/lib/supabaseClient'

const SUBURBS = ['Strand', "Gordon's Bay", 'Somerset West', 'Other Helderberg area']

export default function QuotePage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [suburb, setSuburb] = useState(SUBURBS[0])
  const [service, setService] = useState(services[0].slug)
  const [sizeDetails, setSizeDetails] = useState('')
  const [preferredContact, setPreferredContact] = useState('WhatsApp')
  const [firstBookingDiscount, setFirstBookingDiscount] = useState(true)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const emailRequired = preferredContact === 'Email'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const serviceName = services.find((s) => s.slug === service)?.name ?? service

    // Always capture the lead in the database first
    try {
      await supabase.from('leads').insert({
        name,
        phone,
        email: email.trim() || null,
        suburb,
        service_slug: service,
        service: serviceName,
        message:
          [
            sizeDetails ? `Size / panels / m²: ${sizeDetails}` : null,
            preferredContact ? `Preferred contact: ${preferredContact}` : null,
            firstBookingDiscount ? 'Wants 10% first-booking discount' : null,
            message || null,
          ]
            .filter(Boolean)
            .join(' | ') || null,
        status: 'new',
      })
    } catch (err) {
      console.error('Failed to save lead:', err)
    }

    const lines = [
      'New quote request from the NGSMS website:',
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      `Suburb: ${suburb}`,
      `Service: ${serviceName}`,
      sizeDetails ? `Size / panels / m²: ${sizeDetails}` : null,
      `Preferred contact: ${preferredContact}`,
      firstBookingDiscount ? '10% first-booking discount requested' : null,
      message ? `Details: ${message}` : null,
    ].filter(Boolean)
    const text = encodeURIComponent(lines.join('\n'))
    setSubmitted(true)
    setSending(false)
    window.open(`https://wa.me/27631387945?text=${text}`, '_blank')
  }

  const inputClass =
    'w-full bg-cardgrey border border-darkgrey text-paper placeholder-mist rounded-btn px-4 py-3 focus:outline-none focus:border-blue'

  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Get Started</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Request a Free Quote</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Tell us what you need — we reply the same day (usually within a few hours).
        </p>
        <p className="text-orange text-sm font-bold mt-3">
          10% OFF your first booking · Solar cleaning from R50/panel
        </p>
      </section>

      <section className="bg-graphite py-14 border-t border-darkgrey">
        <div className="max-w-xl mx-auto px-4">
          {submitted ? (
            <div className="text-center bg-cardgrey border-2 border-orange rounded-card p-8">
              <p className="text-orange font-heading font-bold text-lg mb-2">Quote request sent</p>
              <p className="text-mist text-lg">
                We’ve opened WhatsApp with your details filled in — hit send and NGSMS will get back to you
                shortly. You can also call or WhatsApp us directly on{' '}
                <a href="tel:+27631387945" className="text-blue font-bold">
                  063 138 7945
                </a>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Full name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Phone / WhatsApp number</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="063 138 7945"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Area</label>
                <select value={suburb} onChange={(e) => setSuburb(e.target.value)} className={inputClass}>
                  {SUBURBS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Service needed</label>
                <select value={service} onChange={(e) => setService(e.target.value)} className={inputClass}>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">
                  Size / panels / m² (optional but helpful)
                </label>
                <input
                  value={sizeDetails}
                  onChange={(e) => setSizeDetails(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 20 panels, 80 m² driveway, 2 bedrooms"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Preferred contact</label>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value)}
                  className={inputClass}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Call">Phone call</option>
                  <option value="Email">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">
                  Email address {emailRequired ? '' : '(optional)'}
                </label>
                <input
                  required={emailRequired}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
                {emailRequired && (
                  <p className="text-xs text-orange mt-1">
                    Needed so we can send your quote by email.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Tell us more (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="What needs doing, timing, access notes, photos available..."
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="discount"
                  checked={firstBookingDiscount}
                  onChange={(e) => setFirstBookingDiscount(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-orange"
                />
                <label htmlFor="discount" className="text-sm text-mist">
                  I’d like the <span className="text-orange font-bold">10% off first booking</span> discount
                </label>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold px-6 py-4 rounded-btn disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Quote Request via WhatsApp'}
              </button>
              <p className="text-xs text-mist text-center opacity-80">
                Free quotes · No obligation · Serving Strand, Somerset West, Gordon’s Bay & the Helderberg Basin.
                <br />
                Call or WhatsApp{' '}
                <a href="tel:+27631387945" className="text-blue font-semibold">
                  063 138 7945
                </a>{' '}
                anytime. Prefer email?{' '}
                <a href="mailto:info.nextgensolution1@gmail.com" className="text-blue font-semibold">
                  info.nextgensolution1@gmail.com
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
