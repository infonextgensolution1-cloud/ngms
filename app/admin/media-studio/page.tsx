'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function MediaStudioPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void loadCampaigns()
  }, [])

  async function loadAssets(campaignId: string) {
    const { data } = await supabase.from('media_assets').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false })
    setAssets(data || [])
  }

  async function loadCampaigns() {
    const { data } = await supabase
      .from('media_campaigns')
      .select('id,title,service_slug,objective,status,content')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(20)
    setCampaigns(data || [])
  }

  async function createAsset(type: 'image_prompt' | 'reel_storyboard' | 'story_pack') {
    if (!selected) return
    setBusy(type); setMessage('')
    const content = selected.content || {}
    const source = JSON.stringify(content, null, 2)
    const prompt = type === 'image_prompt' ? `Create a premium NGMS marketing image for the approved campaign. Service: ${selected.service_slug}. Use only approved campaign information. Helderberg Basin setting, realistic professional contractor, Jet Black workwear with restrained NextGen Blue and Solar Orange accents, cinematic natural light, clean space for headline and WhatsApp CTA. Do not invent prices or claims. Campaign:
${source}` : type === 'reel_storyboard' ? `Build a 15-30 second vertical Reel storyboard from this approved NGMS campaign. Use only approved claims and offer text. Include scene, on-screen text, voiceover, CTA and shot direction. No invented pricing or claims. Campaign:
${source}` : `Create a 3-frame Story/Status pack from this approved NGMS campaign. Hook, service/value, CTA. Preserve approved pricing and claims exactly; do not invent new ones. Campaign:
${source}`
    const title = type === 'image_prompt' ? 'Branded Image Prompt' : type === 'reel_storyboard' ? 'Reel Storyboard' : 'Story Pack'
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase.from('media_assets').insert({ campaign_id: selected.id, created_by: auth.user?.id || null, asset_type: type, title: `${selected.title} — ${title}`, status: 'draft', prompt, content: { source: content, generated: prompt } })
    if (error) setMessage(error.message); else { setMessage('Asset created. Review it before approval.'); await loadAssets(selected.id) }
    setBusy('')
  }

  async function approveAsset(asset: any) {
    setBusy(asset.id)
    const { data: auth } = await supabase.auth.getUser()
    const { error } = await supabase.from('media_assets').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: auth.user?.id || null }).eq('id', asset.id)
    if (error) setMessage(error.message); else { setMessage('Asset approved.'); await loadAssets(selected.id) }
    setBusy('')
  }

  return (
    <main className="min-h-screen bg-jet text-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-orange text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Solar Forge
        </p>
        <h1 className="font-heading text-3xl sm:text-5xl font-black mt-2">Creative Studio</h1>
        <p className="text-mist mt-2 max-w-2xl">Create production-ready creative assets from approved Solar Forge campaigns.</p>

        <section className="grid lg:grid-cols-[340px_1fr] gap-5 mt-8">
          <aside className="bg-cardgrey border border-darkgrey rounded-2xl p-5 h-fit">
            <h2 className="font-heading font-bold text-xl mb-4">Approved Campaigns</h2>
            <select className="field" defaultValue="" onChange={e => { const item = campaigns.find(c => c.id === e.target.value) || null; setSelected(item); setMessage(''); if (item) void loadAssets(item.id); else setAssets([]) }}>
              <option value="">Choose approved campaign...</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </aside>

          <section className="bg-cardgrey border border-darkgrey rounded-2xl p-5">
            {selected ? (
              <>
                <p className="text-orange text-xs uppercase tracking-widest font-bold">Approved campaign</p>
                <h2 className="font-heading text-2xl font-bold mt-1">{selected.title}</h2>
                <p className="text-mist mt-2">{selected.service_slug} · {selected.objective}</p>
                <div className="flex flex-wrap gap-2 mt-5">{(['image_prompt','reel_storyboard','story_pack'] as const).map(type => <button key={type} onClick={() => void createAsset(type)} disabled={!!busy} className="px-4 py-2 rounded-btn bg-blue-fill text-white font-semibold disabled:opacity-50">{busy === type ? 'Creating…' : type === 'image_prompt' ? 'Create Image Prompt' : type === 'reel_storyboard' ? 'Create Reel Storyboard' : 'Create Story Pack'}</button>)}</div><div className="mt-6 space-y-3">{assets.map(asset => <article key={asset.id} className="bg-jet border border-darkgrey rounded-xl p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-heading font-bold">{asset.title}</h3><p className="text-xs text-mist uppercase">{asset.status} · {asset.asset_type}</p></div><div className="flex gap-2"><button className="p-2 text-mist hover:text-paper" title="Copy prompt" onClick={() => void navigator.clipboard.writeText(asset.prompt || '')}><span>Copy</span></button>{asset.status === 'draft' && <button onClick={() => void approveAsset(asset)} disabled={!!busy} className="px-3 py-2 rounded-btn bg-blue-fill text-white text-sm">Approve</button>}</div></div><pre className="whitespace-pre-wrap text-xs text-mist mt-3">{asset.prompt}</pre></article>)}</div>
              </>
            ) : (
              <div className="min-h-[420px] grid place-items-center text-center">
                <div>
                  <Sparkles className="w-12 h-12 text-orange mx-auto mb-4" />
                  <h2 className="font-heading text-2xl font-bold">Select an approved campaign</h2>
                  <p className="text-mist mt-2">Studio only works from approved campaigns.</p>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
