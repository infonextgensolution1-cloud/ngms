'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Image as ImageIcon, Instagram, MessageCircle, Save, Sparkles, Wand2, Smartphone, Send, Megaphone, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Service = {
  id: string; name: string; slug: string; description: string | null
  hero_benefit: string | null; hero_cta: string | null; seasonal_note: string | null; icon: string | null
}

const PLATFORM_OPTIONS = [
  { id: 'facebook', label: 'Facebook', icon: Megaphone },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'reel', label: 'Reel / Short', icon: Smartphone },
  { id: 'story', label: 'Story / Status', icon: Send },
]

const HASHTAGS = '#NGMS #NextGenMaintenance #OneCallAllSolutions #Helderberg #SomersetWest #Strand #GordonsBay'

function buildCampaign(service: Service, objective: string, offer: string, language: string, platforms: string[]) {
  const name = service.name
  const benefit = service.hero_benefit || service.description || 'Professional property maintenance'
  const cta = service.hero_cta || 'WhatsApp NGMS for a quote'
  const seasonal = service.seasonal_note || ''
  const offerLine = offer.trim() ? '🔥 ' + offer.trim() + '\n\n' : ''
  const english = '🏠 ' + name + '\n\n' + offerLine + benefit + '.\n\n' + (service.description || '') + '\n\n' +
    (seasonal ? 'Cape-season note: ' + seasonal + '\n\n' : '') +
    'Serving homeowners, body corporates, security complexes and light commercial properties.\n\n' +
    '📲 WhatsApp NGMS: 063 138 7945\n' + cta + '\n\nONE CALL. ALL SOLUTIONS.\n' + HASHTAGS
  const afrikaans = '🏠 ' + name + '\n\n' + offerLine + benefit + '.\n\n' + (service.description || '') + '\n\n' +
    (seasonal ? 'Kaapse seisoen-nota: ' + seasonal + '\n\n' : '') +
    'Ons bedien huiseienaars, liggame van mede-eienaars, sekuriteitskomplekse en ligte kommersiële eiendomme.\n\n' +
    '📲 WhatsApp NGMS: 063 138 7945\n' + cta + '\n\nEEN OPROEP. ALLE OPLOSSINGS.\n' + HASHTAGS

  const hook = objective === 'bookings'
    ? 'STOP WAITING. BOOK ' + name.toUpperCase() + '.'
    : objective === 'awareness'
      ? 'MEET THE NGMS ' + name.toUpperCase() + ' SERVICE.'
      : 'WHY ' + name.toUpperCase() + ' SHOULD BE ON YOUR MAINTENANCE LIST.'
  const reel = hook + '\n\nScene 1 — Problem / before\nScene 2 — NGMS work in progress\nScene 3 — Clean finished result\nScene 4 — Service benefit: ' + benefit + '\nScene 5 — CTA: WhatsApp 063 138 7945\n\nOn-screen CTA: ONE CALL. ALL SOLUTIONS.'
  const story = name + '\n\n' + (offer || benefit) + '\n\n📲 063 138 7945\n\nSWIPE / MESSAGE NGMS'
  const visual = 'NGMS premium documentary-style visual for ' + name + ', Helderberg Basin property, real South African residential setting, professional contractor at work, Jet Black workwear with restrained Solar Orange and NextGen Blue accents, cinematic natural light, realistic materials and surfaces, no fake logos, no distorted hands, no invented claims, leave clean negative space for headline and WhatsApp CTA.'

  const outputs: Record<string, any> = {
    facebook: { title: name + ' — Facebook', english, afrikaans },
    instagram: { title: name + ' — Instagram', english, afrikaans },
    whatsapp: { title: name + ' — WhatsApp Broadcast', english, afrikaans },
    reel: { title: name + ' — Reel / Short', english: reel, afrikaans: reel.replace('BOOK', 'BESPREek').replace('STOP WAITING', 'MOENIE WAG NIE') },
    story: { title: name + ' — Story / Status', english: story, afrikaans: name + '\n\n' + (offer || benefit) + '\n\n📲 063 138 7945\n\nSTUUR ’N BOODSKAP AAN NGMS' },
    visual_prompt: { title: 'NGMS Visual Prompt', english: visual, afrikaans: visual },
  }
  return Object.fromEntries(Object.entries(outputs).filter(([key]) => key === 'visual_prompt' || platforms.includes(key)))
}

export default function MediaWizardPage() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceSlug, setServiceSlug] = useState('')
  const [objective, setObjective] = useState('bookings')
  const [offer, setOffer] = useState('')
  const [language, setLanguage] = useState('English + Afrikaans')
  const [platforms, setPlatforms] = useState(['facebook', 'instagram', 'whatsapp', 'reel', 'story'])
  const [campaign, setCampaign] = useState<Record<string, any> | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [status, setStatus] = useState<'draft'|'approved'>('draft')
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('services').select('id,name,slug,description,hero_benefit,hero_cta,seasonal_note,icon').eq('is_active', true).order('sort_order')
      setServices(data || [])
      if (data?.[0]) setServiceSlug(data[0].slug)
      setLoading(false)
    }
    void load()
    void loadHistory()
  }, [])

  const selectedService = useMemo(() => services.find(s => s.slug === serviceSlug), [services, serviceSlug])

  function togglePlatform(id: string) {
    setPlatforms(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  }

  function generate() {
    if (!selectedService || platforms.length === 0) return
    setGenerating(true); setSaved(false); setCampaignId(''); setStatus('draft')
    setTimeout(() => {
      setTitle(selectedService.name + ' Campaign — ' + new Date().toLocaleDateString('en-ZA'))
      setCampaign(buildCampaign(selectedService, objective, offer, language, platforms))
      setGenerating(false)
    }, 450)
  }

  async function loadHistory() {
    const { data } = await supabase.from('media_campaigns').select('id,title,service_slug,objective,status,created_at,approved_at').order('created_at', { ascending: false }).limit(8)
    setHistory(data || [])
  }

  async function approveCampaign() {
    if (!campaignId) return
    const { data: auth } = await supabase.auth.getSession()
    if (!auth.session) { window.location.href = '/admin'; return }
    const { error } = await supabase.from('media_campaigns').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: auth.session.user.id }).eq('id', campaignId)
    if (!error) { setStatus('approved'); void loadHistory() }
  }

  async function saveCampaign() {
    if (!campaign || !selectedService) return
    setSaving(true)
    const { data: auth } = await supabase.auth.getSession()
    if (!auth.session) { window.location.href = '/admin'; setSaving(false); return }
    const { data, error } = await supabase.from('media_campaigns').insert({
      created_by: auth.session.user.id, title: title || selectedService.name + ' Campaign',
      service_slug: selectedService.slug, objective, language, platforms,
      offer_text: offer || null,
      brief: { service: selectedService.name, objective, language, platforms },
      content: campaign,
    }).select('id').single()
    if (!error) { setCampaignId(data?.id || ''); setStatus('draft'); void loadHistory() }
    setSaved(!error); setSaving(false)
  }

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(key); setTimeout(() => setCopied(''), 1500)
  }

  return (
    <main className="min-h-screen bg-jet text-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 text-orange text-xs font-bold uppercase tracking-[0.2em] mb-2"><Sparkles className="w-4 h-4" /> NGMS Solar Forge</div>
            <h1 className="font-heading text-3xl sm:text-5xl font-black">Media Wizard</h1>
            <p className="text-mist max-w-2xl mt-2">Create a complete NGMS campaign from the live service catalogue — Facebook, Instagram, WhatsApp, Reels, Stories and visual prompts.</p>
          </div>
          <a href="/admin" className="btn-dark text-sm inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Admin</a>
        </header>

        <section className="grid xl:grid-cols-[360px_1fr] gap-5">
          <aside className="bg-cardgrey border border-darkgrey rounded-2xl p-5 h-fit">
            <div className="flex items-center gap-2 mb-5"><Wand2 className="w-5 h-5 text-orange" /><h2 className="font-heading font-bold text-xl">Campaign Builder</h2></div>
            <label className="block text-xs uppercase tracking-widest text-mist mb-2">Service</label>
            <select value={serviceSlug} onChange={e => setServiceSlug(e.target.value)} className="field mb-5">
              {loading && <option>Loading services…</option>}
              {services.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
            </select>
            <label className="block text-xs uppercase tracking-widest text-mist mb-2">Objective</label>
            <select value={objective} onChange={e => setObjective(e.target.value)} className="field mb-5">
              <option value="bookings">Generate bookings</option><option value="awareness">Build awareness</option><option value="engagement">Drive engagement</option><option value="maintenance">Promote maintenance plans</option>
            </select>
            <label className="block text-xs uppercase tracking-widest text-mist mb-2">Approved offer / promotion</label>
            <textarea value={offer} onChange={e => setOffer(e.target.value)} placeholder="Optional — enter an approved current offer. The wizard will not invent pricing." className="field min-h-24 mb-5" />
            <label className="block text-xs uppercase tracking-widest text-mist mb-2">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="field mb-5">
              <option>English + Afrikaans</option><option>English</option><option>Afrikaans</option>
            </select>
            <label className="block text-xs uppercase tracking-widest text-mist mb-2">Formats</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {PLATFORM_OPTIONS.map(({ id, label, icon: Icon }) => {
                const active = platforms.includes(id)
                return <button key={id} onClick={() => togglePlatform(id)} className={'border rounded-xl p-3 text-left text-xs font-semibold transition ' + (active ? 'border-blue bg-blue/10 text-paper' : 'border-darkgrey text-mist')}><Icon className={'w-4 h-4 mb-2 ' + (active ? 'text-orange' : '')} />{label}{active && <Check className="float-right w-4 h-4 text-orange" />}</button>
              })}
            </div>
            <button onClick={generate} disabled={generating || !selectedService || platforms.length === 0} className="btn-primary w-full inline-flex items-center justify-center gap-2">{generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}{generating ? 'Building campaign…' : 'Generate Campaign'}</button>
            {campaign && <button onClick={saveCampaign} disabled={saving || saved} className="btn-dark w-full mt-2 inline-flex items-center justify-center gap-2">{saved ? <Check className="w-4 h-4 text-whatsapp" /> : <Save className="w-4 h-4" />}{saved ? 'Saved to Solar Forge' : saving ? 'Saving…' : 'Save Campaign'}</button>}
            {campaign && saved && status !== 'approved' && <button onClick={approveCampaign} className="btn-primary w-full mt-2 inline-flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Approve Campaign</button>}
          </aside>

          <section className="space-y-4">
            {history.length > 0 && <div className="bg-cardgrey border border-darkgrey rounded-2xl p-5"><div className="flex items-center justify-between mb-3"><h2 className="font-heading font-bold">Solar Forge History</h2><span className="text-xs text-mist">{history.length} recent campaigns</span></div><div className="space-y-2">{history.map((h:any) => <div key={h.id} className="flex items-center justify-between gap-3 border border-darkgrey rounded-xl px-3 py-2 text-sm"><div><span className="font-semibold">{h.title}</span><span className="text-mist ml-2">{h.objective}</span></div><span className={h.status === 'approved' ? 'text-whatsapp text-xs uppercase' : 'text-orange text-xs uppercase'}>{h.status}</span></div>)}</div></div>}
            {!campaign ? (
              <div className="min-h-[500px] border border-dashed border-darkgrey rounded-2xl grid place-items-center text-center p-8">
                <div><Megaphone className="w-12 h-12 text-orange mx-auto mb-4" /><h2 className="font-heading text-2xl font-bold">Ready to create</h2><p className="text-mist max-w-lg mt-2">Choose a service and campaign objective. Solar Forge will use the current NGMS service data and create platform-ready content without inventing prices or claims.</p></div>
              </div>
            ) : (
              <>
                <div className="bg-cardgrey border border-darkgrey rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div><p className="text-orange text-xs uppercase tracking-widest font-bold">Campaign ready</p><h2 className="font-heading text-2xl font-bold mt-1">{title}</h2><p className="text-sm text-mist mt-1">{selectedService?.name} · {objective} · {language}</p></div>
                  <button onClick={() => copyText('all', Object.values(campaign).map((x:any) => x.title + '\n\n' + x.english + '\n\nAFRIKAANS:\n' + x.afrikaans).join('\n\n---\n\n'))} className="btn-dark text-sm inline-flex items-center gap-2"><Copy className="w-4 h-4" />{copied === 'all' ? 'Copied' : 'Copy all'}</button>
                </div>
                {Object.entries(campaign).map(([key, item]: any) => (
                  <article key={key} className="bg-cardgrey border border-darkgrey rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 mb-4"><div><p className="text-orange text-xs uppercase tracking-widest font-bold">{key === 'visual_prompt' ? 'Visual Studio' : key}</p><h3 className="font-heading text-lg font-bold">{item.title}</h3></div><ImageIcon className="w-5 h-5 text-mist" /></div>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <div><div className="flex justify-between items-center mb-2"><span className="text-xs uppercase tracking-widest text-mist">English</span><button onClick={() => copyText(key+'en', item.english)} className="text-xs text-mist hover:text-orange">{copied === key+'en' ? 'Copied' : 'Copy'}</button></div><pre className="whitespace-pre-wrap font-sans text-sm text-paper/90 bg-jet border border-darkgrey rounded-xl p-4 min-h-40">{item.english}</pre></div>
                      <div><div className="flex justify-between items-center mb-2"><span className="text-xs uppercase tracking-widest text-mist">Afrikaans</span><button onClick={() => copyText(key+'af', item.afrikaans)} className="text-xs text-mist hover:text-orange">{copied === key+'af' ? 'Copied' : 'Copy'}</button></div><pre className="whitespace-pre-wrap font-sans text-sm text-paper/90 bg-jet border border-darkgrey rounded-xl p-4 min-h-40">{item.afrikaans}</pre></div>
                    </div>
                  </article>
                ))}
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
