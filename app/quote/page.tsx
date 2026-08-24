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
      'New quote request from the NGMS website:',
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

  return (
    <main className="bg-white text-black">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-orange font-bold text-sm uppercase tracking-wide mb-2">Get Started</p>
        <h1 className="text-4xl sm:text-6xl font-black">Request a Free Quote</h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto mt-4">
          Tell us what you need and we’ll come back to you — usually the same day.
        </p>
      </section>

      <section className="max-w-xl mx-auto px-4 py-14">
        {submitted ? (
          <div className="text-center border-2 border-orange rounded-2xl p-8">
            <p className="text-orange font-bold text-lg mb-2">Quote request sent</p>
            <p className="text-gray-700 text-lg">
              We’ve opened WhatsApp with your details filled in — hit send and NGMS will get back to you shortly.
              You can also call or WhatsApp us directly on{' '}
              <a href="tel:+27631387945" className="text-orange font-bold">063 138 7945</a>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-1">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Phone number</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="082 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Area</label>
              <select
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              >
                {SUBURBS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Service needed</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              >
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Tell us more (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="What needs doing, size of the job, timing..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange hover:bg-orange-dark text-white font-bold px-6 py-4 rounded-full"
            >
              Send via WhatsApp
            </button>
            <p className="text-xs text-gray-600 text-center">
              This opens WhatsApp with your details pre-filled. Prefer email? Write to{' '}
              <a href="mailto:info.nextgensolution1@gmail.com" className="text-orange font-semibold">info.nextgensolution1@gmail.com</a>.
            </p>
          </form>
        )}
      </section>
    </main>
  )
}
