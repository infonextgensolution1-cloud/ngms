'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, BarChart3, Building2, ClipboardList, FileText, Grid3X3, Image,
  ImageIcon, Loader2, LogOut, Megaphone, Menu, MessageCircle, Paintbrush,
  Search, Settings, Sparkles, Sun, TrendingUp, Users, Wrench, X, Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import PromptModal from '@/components/prompt-dashboard/PromptModal'

type Category = {
  id: string
  name: string
  description: string | null
  icon: string
  sort_order: number
  active: boolean
}

type Prompt = {
  id: string
  category_id: string
  title: string
  description: string | null
  prompt_template: string
  variables: string[]
  output_format: string | null
  active: boolean
}

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Megaphone, Sun, Paintbrush, Wrench, Zap, Grid3X3, Building2,
  MessageCircle, Image, ClipboardList, TrendingUp,
}

export default function PromptDashboardPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Prompt | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      const { data: auth } = await supabase.auth.getSession()
      if (!auth.session) {
        window.location.href = '/admin'
        return
      }
      setUserEmail(auth.session.user.email || '')

      const [{ data: cats, error: catError }, { data: ps, error: promptError }] = await Promise.all([
        supabase.from('prompt_categories').select('*').eq('active', true).order('sort_order'),
        supabase.from('prompts').select('*').eq('active', true).order('created_at'),
      ])

      if (catError || promptError) {
        setError(catError?.message || promptError?.message || 'Unable to load prompt library.')
      } else {
        setCategories(cats || [])
        setPrompts(ps || [])
      }
      setLoading(false)
    }

    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return prompts
    return prompts.filter((p) =>
      [p.title, p.description, p.prompt_template].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [prompts, query])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/admin'
  }

  return (
    <main className="min-h-screen bg-jet text-paper">
      <div className="min-h-screen flex">
        <aside className={'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0c0e11] border-r border-darkgrey transform transition-transform lg:transform-none ' + (mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
          <div className="h-full flex flex-col">
            <div className="p-5 border-b border-darkgrey flex items-center justify-between">
              <Link href="/prompt-dashboard" className="flex items-center gap-3" onClick={() => setMobileNav(false)}>
                <span className="h-10 w-10 rounded-xl bg-orange text-black grid place-items-center font-heading font-black">NG</span>
                <span>
                  <span className="block font-heading font-bold text-lg leading-none">NGMS</span>
                  <span className="block text-[10px] text-mist uppercase tracking-[0.18em] mt-1">Prompt Dashboard</span>
                </span>
              </Link>
              <button className="lg:hidden text-mist" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X className="w-5 h-5" /></button>
            </div>

            <nav className="p-4 space-y-1">
              <Link href="/prompt-dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-blue/15 text-paper border border-blue/30">
                <Sparkles className="w-4 h-4 text-orange" /> Dashboard
              </Link>
              <Link href="/admin" className="flex items-center gap-3 px-3 py-3 rounded-lg text-mist hover:text-paper hover:bg-white/5">
                <ArrowLeft className="w-4 h-4" /> Main Admin
              </Link>
              <Link href="/admin/media" className="flex items-center gap-3 px-3 py-3 rounded-lg text-mist hover:text-paper hover:bg-white/5">
                <ImageIcon className="w-4 h-4" /> Media
              </Link>
              <div className="pt-5 pb-2 px-3 text-[10px] uppercase tracking-[0.2em] text-mist">Coming next</div>
              <div className="flex items-center gap-3 px-3 py-3 text-mist/60"><Users className="w-4 h-4" /> CRM</div>
              <div className="flex items-center gap-3 px-3 py-3 text-mist/60"><FileText className="w-4 h-4" /> Quote Builder</div>
              <div className="flex items-center gap-3 px-3 py-3 text-mist/60"><BarChart3 className="w-4 h-4" /> Activity</div>
              <div className="flex items-center gap-3 px-3 py-3 text-mist/60"><Settings className="w-4 h-4" /> Settings</div>
            </nav>

            <div className="mt-auto p-4 border-t border-darkgrey">
              <div className="text-xs text-mist truncate mb-3">{userEmail}</div>
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 btn-dark text-xs"><LogOut className="w-4 h-4" /> Sign out</button>
            </div>
          </div>
        </aside>

        {mobileNav && <button className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" />}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 bg-jet/90 backdrop-blur border-b border-darkgrey">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
              <button onClick={() => setMobileNav(true)} className="lg:hidden p-2 border border-darkgrey rounded-lg text-mist" aria-label="Open navigation"><Menu className="w-5 h-5" /></button>
              <div className="min-w-0 flex-1">
                <p className="text-orange text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">NGMS Internal Operations</p>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold truncate">Prompt Dashboard</h1>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-mist border border-darkgrey rounded-full px-3 py-2"><span className="h-2 w-2 rounded-full bg-whatsapp animate-pulse" /> Connected</div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-8">
              <div>
                <p className="text-mist max-w-2xl">One workspace for reusable NGMS quotations, customer messages, marketing prompts and field documentation.</p>
              </div>
              <label className="relative w-full xl:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
                <input aria-label="Search prompts" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts..." className="field pl-10" />
              </label>
            </div>

            {loading ? (
              <div className="min-h-[40vh] grid place-items-center">
                <div className="text-center"><Loader2 className="w-7 h-7 text-orange animate-spin mx-auto mb-3" /><p className="text-mist text-sm">Loading the prompt library…</p></div>
              </div>
            ) : error ? (
              <div className="border border-orange/40 bg-orange/10 rounded-xl p-5 text-sm text-orange">
                <p className="font-bold mb-1">Prompt library unavailable</p><p>{error}</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {categories.map((category) => {
                    const Icon = icons[category.icon] || Sparkles
                    const categoryPrompts = filtered.filter((p) => p.category_id === category.id)

                    return (
                      <article key={category.id} className="group bg-cardgrey border border-darkgrey rounded-2xl p-5 hover:border-blue/60 hover:-translate-y-0.5 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-5">
                          <div className="h-11 w-11 rounded-xl bg-jet border border-darkgrey grid place-items-center text-orange group-hover:border-orange/50"><Icon className="w-5 h-5" /></div>
                          <span className="text-[10px] uppercase tracking-widest text-mist border border-darkgrey rounded-full px-2.5 py-1">{categoryPrompts.length} prompts</span>
                        </div>
                        <h2 className="font-heading text-xl font-bold text-paper">{category.name}</h2>
                        <p className="text-sm text-mist mt-1.5 min-h-10">{category.description}</p>
                        <div className="mt-5 space-y-2">
                          {categoryPrompts.slice(0, 4).map((prompt) => (
                            <button key={prompt.id} onClick={() => setSelected(prompt)} className="w-full text-left px-3 py-2.5 rounded-lg border border-darkgrey bg-jet/70 hover:border-blue hover:bg-blue/10 transition flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-paper truncate">{prompt.title}</span><span className="text-orange">→</span>
                            </button>
                          ))}
                          {categoryPrompts.length === 0 && <p className="text-xs text-mist border border-dashed border-darkgrey rounded-lg p-3">No matching prompts.</p>}
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="mt-8 border border-darkgrey rounded-2xl bg-[#0d0f12] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-orange/10 text-orange grid place-items-center"><Sparkles className="w-5 h-5" /></div>
                    <div><p className="font-heading font-bold text-paper">Quick Tip</p><p className="text-sm text-mist mt-1">Combine prompt outputs across categories. For example, use a quotation prompt with an AI image prompt to build a consistent branded proposal package.</p></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {selected && (
        <PromptModal
          prompt={selected}
          categoryName={categories.find((c) => c.id === selected.category_id)?.name || 'NGMS Prompt'}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  )
}
