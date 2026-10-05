'use client'

import { useEffect, useMemo, useState } from 'react'
import { Send, BarChart3, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const channels = ['facebook','instagram','whatsapp','reel','story'] as const

export default function MediaPublishingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [channel, setChannel] = useState<(typeof channels)[number]>('facebook')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState('')
  const [stats, setStats] = useState({click:0,lead:0,quote:0,booking:0})

  useEffect(() => { void loadCampaigns() }, [])

  async function loadCampaigns() {
    const { data } = await supabase.from('media_campaigns').select('id,title,service_slug,status,approved_at').eq('status','approved').order('approved_at',{ascending:false}).limit(30)
    setCampaigns(data || [])
  }

  async function loadCampaign(id: string) {
    const c = campaigns.find(x => x.id === id) || null
    setSelected(c); setMessage('')
    if (!c) { setAssets([]); return }
    const { data } = await supabase.from('media_assets').select('*').eq('campaign_id',id).eq('status','approved').order('created_at',{ascending:false})
    setAssets(data || [])
    const { data: events } = await supabase.from('media_attribution_events').select('event_type').eq('campaign_id',id)
    const next = {click:0,lead:0,quote:0,booking:0}
    ;(events || []).forEach((e:any) => { if (e.event_type in next) next[e.event_type as keyof typeof next]++ })
    setStats(next)
  }

  const slug = useMemo(() => selected?.title ? selected.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') : 'ngms-campaign', [selected])
  const trackingUrl = selected ? `https://www.nextgensolarmaintenance.co.za/?utm_source=${channel}&utm_medium=social&utm_campaign=${slug}` : ''

  async function queuePublication(asset: any) {
    if (!selected) return
    setBusy(asset.id); setMessage('')
    const { data: auth } = await supabase.auth.getUser()
    const attributionKey = `${selected.id}:${asset.id}:${channel}`
    const { error } = await supabase.from('media_publications').upsert({
      campaign_id:selected.id, asset_id:asset.id, created_by:auth.user?.id || null,
      channel, status:'queued', publish_url:trackingUrl,
      utm_source:channel, utm_medium:'social', utm_campaign:slug,
      utm_content:asset.asset_type, attribution_key:attributionKey
    }, { onConflict:'attribution_key' })
    if (error) setMessage(error.message); else setMessage(`Queued for ${channel}. Tracking URL is ready.`)
    setBusy('')
  }

  return <main className="min-h-screen bg-jet text-paper"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <p className="text-orange text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-2"><Send className="w-4 h-4"/> Solar Forge</p>
    <h1 className="font-heading text-3xl sm:text-5xl font-black mt-2">Publishing & Attribution</h1>
    <p className="text-mist mt-2 max-w-2xl">Queue approved creative for social distribution and keep campaign performance tied to the original NGMS campaign.</p>

    <section className="grid lg:grid-cols-[340px_1fr] gap-5 mt-8">
      <aside className="bg-cardgrey border border-darkgrey rounded-2xl p-5 h-fit">
        <h2 className="font-heading font-bold text-xl mb-4">Approved Campaigns</h2>
        <select className="field" defaultValue="" onChange={e => void loadCampaign(e.target.value)}>
          <option value="">Choose campaign...</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {selected && <div className="grid grid-cols-2 gap-2 mt-5">
          {Object.entries(stats).map(([k,v]) => <div key={k} className="rounded-xl bg-jet border border-darkgrey p-3"><p className="text-xs uppercase text-mist">{k}</p><p className="text-2xl font-bold mt-1">{v as number}</p></div>)}
        </div>}
      </aside>

      <section className="bg-cardgrey border border-darkgrey rounded-2xl p-5">
        {selected ? <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-orange text-xs uppercase tracking-widest font-bold">Approved campaign</p><h2 className="font-heading text-2xl font-bold mt-1">{selected.title}</h2><p className="text-mist mt-2">{selected.service_slug}</p></div>
            <select className="field max-w-[180px]" value={channel} onChange={e => setChannel(e.target.value as any)}>{channels.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="mt-5 p-4 rounded-xl bg-jet border border-darkgrey"><p className="text-xs uppercase text-mist">Attribution URL</p><div className="flex gap-2 mt-2"><input className="field flex-1" readOnly value={trackingUrl}/><button className="px-3 rounded-btn bg-blue-fill" title="Copy tracking URL" onClick={() => void navigator.clipboard.writeText(trackingUrl)}><Link2 className="w-4 h-4"/></button></div></div>
          {message && <p className="mt-4 text-sm text-orange">{message}</p>}
          <div className="mt-6 space-y-3">{assets.length ? assets.map(asset => <article key={asset.id} className="bg-jet border border-darkgrey rounded-xl p-4 flex items-center justify-between gap-4"><div><h3 className="font-heading font-bold">{asset.title}</h3><p className="text-xs text-mist uppercase">{asset.asset_type} · approved</p></div><button onClick={() => void queuePublication(asset)} disabled={!!busy} className="px-4 py-2 rounded-btn bg-blue-fill text-white font-semibold">{busy === asset.id ? 'Queueing…' : 'Queue Publish'}</button></article>) : <div className="py-16 text-center text-mist">No approved creative assets yet. Approve assets in Creative Studio first.</div>}</div>
        </> : <div className="min-h-[420px] grid place-items-center text-center"><BarChart3 className="w-12 h-12 text-orange mx-auto mb-4"/><h2 className="font-heading text-2xl font-bold">Select an approved campaign</h2><p className="text-mist mt-2">Publishing is locked to approved campaigns and assets.</p></div>}
      </section>
    </section>
  </div></main>
}
