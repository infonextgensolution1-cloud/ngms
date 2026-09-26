'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertTriangle, Save } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { SOURCES, STATUS_LABEL, normalisePhone, type LeadSource } from '@/lib/ngms-leads-ui'

type ServiceRow = { slug: string; name: string }

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'
const PHONE_SOURCES = SOURCES.filter((s) => s !== 'website') as LeadSource[]

function Form() {
  const router = useRouter()
  const [services, setServices] = useState<ServiceRow[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [suburb, setSuburb] = useState('')
  const [serviceSlug, setServiceSlug] = useState('')
  const [message, setMessage] = useState('')
  const [source, setSource] = useState<LeadSource>('phone')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dupWarning, setDupWarning] = useState('')

  useEffect(() => {
    supabase
      .from('services')
      .select('slug,name')
      .order('name')
      .then(({ data }) => setServices((data ?? []) as ServiceRow[]))
  }, [])

  async function save() {
    setError('')
    setDupWarning('')
    if (!name.trim()) return setError('Add the name or complex.')
    if (!phone.trim()) return setError('Add a phone number.')
    const normPhone = normalisePhone(phone.trim())
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('That email doesn\'t look right.')

    setSaving(true)
    try {
      const tail = normPhone.replace(/\D/g, '').slice(-9)
      const { data: dupes } = await supabase.from('leads').select('id,name').ilike('phone', `%${tail}`).limit(5)

      const hit = services.find((s) => s.slug === serviceSlug)
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: name.trim(),
          phone: normPhone,
          email: email.trim() || null,
          suburb: suburb.trim() || null,
          service: hit?.name ?? null,
          service_slug: serviceSlug || null,
          message: message.trim() || null,
          source,
          status: 'new',
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      if (dupes?.length) setDupWarning(`Heads up: same phone on ${dupes.length} other lead(s) — saved anyway.`)
      router.push(`/admin/leads/${(data as { id: string }).id}`)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link href="/admin/leads" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Leads
        </Link>
        <h1 className="font-heading text-2xl font-bold text-paper mb-5">Add lead</h1>

        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 grid gap-3">
          <input className={input} placeholder="Name or complex *" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={input} placeholder="Phone *" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className={input} placeholder="Email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} placeholder="Suburb (e.g. Gordon's Bay)" value={suburb} onChange={(e) => setSuburb(e.target.value)} />

          <label className="text-xs text-mist">
            Service
            <select className={`${input} mt-1`} value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)}>
              <option value="">Not specified</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-mist">
            How it came in
            <select className={`${input} mt-1`} value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>
              {PHONE_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('-', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-mist">
            What they asked for
            <textarea
              className={`${input} mt-1 min-h-[88px]`}
              placeholder="Size, panel count, m², urgency…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          {error && (
            <p className="text-sm text-orange flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </p>
          )}
          {dupWarning && <p className="text-xs text-orange">{dupWarning}</p>}

          <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 bg-orange hover:opacity-90 text-white font-heading font-semibold px-4 py-3 rounded-btn disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save lead ({STATUS_LABEL.new})
          </button>
        </section>
      </div>
    </main>
  )
}

export default function NewLeadPage() {
  return (
    <StaffGate title="Add lead">
      <Form />
    </StaffGate>
  )
}
