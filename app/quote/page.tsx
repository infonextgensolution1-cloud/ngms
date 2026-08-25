'use client'

import { useState } from 'react'
import { services } from '@/lib/services'

const SUBURBS = ['Strand', 'Gordon’s Bay', 'Somerset West', 'Other Helderberg area']

export default function QuotePage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [suburb, setSuburb] = useState(SUBURBS[0])
  const [service, setService] = useState(services[0].slug)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const serviceName = services.find((s) => s.slug === service)?.name ?? service
    const lines = [
      'New quote request from the NGSMS website:',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Suburb: ${suburb}`,
      `Service: ${serviceName}`,
      message ? `Details: ${message}` : null,
    ].filter(Boolean)
    const text = encodeURIComponent(lines.join('\n'))
    setSubmitted(true)
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
          Tell us what you need and we’ll come back to you — usually the same day.
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
                <a href="tel:+27631387945" className="text-blue font-bold">063 138 7945</a>.
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
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Phone number</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="082 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Area</label>
                <select value={suburb} onChange={(e) => setSuburb(e.target.value)} className={inputClass}>
                  {SUBURBS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Service needed</label>
                <select value={service} onChange={(e) => setService(e.target.value)} className={inputClass}>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Tell us more (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="What needs doing, size of the job, timing..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-4 rounded-btn"
              >
                Send via WhatsApp
              </button>
              <p className="text-xs text-mist text-center opacity-80">
                This opens WhatsApp with your details pre-filled. Prefer email? Write to{' '}
                <a href="mailto:info.nextgensolution1@gmail.com" className="text-blue font-semibold">info.nextgensolution1@gmail.com</a>.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
