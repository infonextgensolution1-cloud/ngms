'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function MediaStudioPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    void loadCampaigns()
  }, [])

  async function loadCampaigns() {
    const { data } = await supabase
      .from('media_campaigns')
      .select('id,title,service_slug,objective,status,content')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(20)
    setCampaigns(data || [])
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
            <select className="field" defaultValue="" onChange={e => setSelected(campaigns.find(c => c.id === e.target.value) || null)}>
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
                <pre className="whitespace-pre-wrap bg-jet border border-darkgrey rounded-xl p-4 mt-5 text-sm">{JSON.stringify(selected.content, null, 2)}</pre>
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
