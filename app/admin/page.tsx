'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import BusinessSummary from '@/components/admin/BusinessSummary'
import AdminSearch from '@/components/admin/AdminSearch'
import MfaChallenge from '@/components/admin/MfaChallenge'
import MfaSetup from '@/components/admin/MfaSetup'
import WeekAheadButton from '@/components/admin/WeekAheadButton'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Image as ImageIcon, LogOut, Sparkles, Send, Users, Receipt, FileText, Cloud, LucideIcon, HardHat, Wallet, Boxes, Contact, CalendarDays, BarChart3, Activity, RefreshCw } from 'lucide-react'

const NAV_ITEMS: Array<{
  href: string
  icon: LucideIcon
  title: string
  desc: string
}> = [
  {
    href: '/admin/ai-quote-intake',
    icon: Sparkles,
    title: 'AI Quote Intake',
    desc: 'Turn WhatsApp/site notes into structured quote-ready scope for staff review',
  },
  {
    href: '/admin/leads',
    icon: Users,
    title: 'Leads',
    desc: 'Work the pipeline: new → contacted → site visit → quoted → won/lost',
  },
  {
    href: '/admin/maintenance',
    icon: RefreshCw,
    title: 'Maintenance Control',
    desc: 'Customer offers, activation links, active plans and upcoming service cycles',
  },
  {
    href: '/admin/plans',
    icon: CalendarDays,
    title: 'Maintenance plans',
    desc: 'Plan sign-ups, next visit due dates and automatic reminders',
  },
  {
    href: '/admin/clients',
    icon: Contact,
    title: 'Clients',
    desc: 'Everyone you have quoted: contact details and full history',
  },
  {
    href: '/admin/quotes',
    icon: FileText,
    title: 'Quotes',
    desc: 'Build, send & track quotes — branded PDF, ZAR, Capitec banking',
  },
  {
    href: '/admin/invoices',
    icon: Receipt,
    title: 'Invoices',
    desc: "Track what's owed, record payments, chase overdue",
  },
  {
    href: '/admin/jobs',
    icon: HardHat,
    title: 'Jobs',
    desc: 'Schedule, cost & photograph jobs — client-ready completion reports',
  },
  {
    href: '/admin/calendar',
    icon: CalendarDays,
    title: 'Job calendar',
    desc: 'Month view of booked jobs, rain flags, and Google Calendar sync',
  },
  {
    href: '/admin/reports',
    icon: BarChart3,
    title: 'Monthly report',
    desc: 'Invoiced, collected, profit and spend by month, with Excel for the bookkeeper',
  },
  {
    href: '/admin/analytics',
    icon: Activity,
    title: 'Site Traffic',
    desc: 'Website visitors, top pages, where people found you & phone vs computer',
  },
  {
    href: '/admin/wages',
    icon: Wallet,
    title: 'Wages & Payroll',
    desc: 'Crew profiles, banking details, documents & payslip generator',
  },
  {
    href: '/admin/materials',
    icon: Boxes,
    title: 'Materials & Suppliers',
    desc: 'Builders Warehouse catalog, supplier directory & purchase log',
  },
  {
    href: '/admin/media',
    icon: ImageIcon,
    title: 'Media',
    desc: 'Manage admin-driven hero slides, promotions, before/after pairs & the gallery',
  },
  {
    href: '/admin/media-wizard',
    icon: Sparkles,
    title: 'Solar Forge Media Wizard',
    desc: 'Create Facebook, Instagram, WhatsApp, Reels, Stories, promotions and bilingual campaigns',
  },
  {
    href: '/admin/media-studio',
    icon: Sparkles,
    title: 'Solar Forge Creative Studio',
    desc: 'Turn approved campaigns into branded creative assets, Reels and Story packs',
  },
  {
    href: '/admin/media-publishing',
    icon: Send,
    title: 'Solar Forge Publishing & Attribution',
    desc: 'Queue approved creative for social distribution and track campaign attribution',
  },
  {
    href: '/admin/prompts',
    icon: Sparkles,
    title: 'Prompt Dashboard',
    desc: '48 ready-made prompts for quotes, marketing, scheduling & more',
  },
  {
    href: '/admin/prompt-library',
    icon: Sparkles,
    title: 'NGMS Prompt Library',
    desc: 'Client-getting, marketing & content prompts filled in for NGMS, English + Afrikaans',
  },
  {
    href: '/admin/vercel-projects',
    icon: Cloud,
    title: 'Vercel Projects',
    desc: 'Monitor NGMS deployment status & project info on Vercel',
  },
]

// Read-only view of the same 'site-visitors' presence channel the public
// site tracks itself into (see components/VisitorPresence.tsx). This tab
// never calls channel.track() itself, so it never counts as a visitor.
function LiveVisitors() {
  const [state, setState] = useState<Record<string, { path?: string }[]>>({})

  useEffect(() => {
    const channel = supabase.channel('site-visitors')
    channel
      .on('presence', { event: 'sync' }, () => {
        setState(channel.presenceState() as Record<string, { path?: string }[]>)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const entries = Object.values(state).flat()
  const count = entries.length

  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${count > 0 ? 'bg-whatsapp animate-pulse' : 'bg-darkgrey'}`} />
        <p className="font-heading font-bold text-paper">
          {count} {count === 1 ? 'person' : 'people'} on the site right now
        </p>
      </div>
      {entries.length > 0 && (
        <ul className="text-sm text-mist space-y-1 mt-2">
          {entries.map((e, i) => (
            <li key={i}>{e.path || '/'}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { session, mfaPending, checking, refresh } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSigningIn(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setSigningIn(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (checking) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }

  if (mfaPending) return <MfaChallenge onDone={refresh} />

  if (!session) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-jet px-4 py-16">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-cardgrey border border-darkgrey rounded-card p-8 space-y-4"
        >
          <h1 className="font-heading text-2xl font-bold text-paper mb-1">Staff Login</h1>
          <p className="text-sm text-mist mb-4">NGSMS admin — hero slides, before/after &amp; gallery.</p>

          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3 focus:outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3 focus:outline-none focus:border-blue"
            />
          </div>

          {error && <p className="text-sm text-orange">{error}</p>}

          <button
            type="submit"
            disabled={signingIn}
            className="w-full bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-6 py-3 rounded-btn disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            {signingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-[70vh] bg-[#e9e8e4] text-[#111111] px-3 py-6 sm:px-6 sm:py-10">
      <div className="max-w-7xl mx-auto border border-[#222222] bg-[#f4f3ef]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_auto] border-b border-[#222222]">
          <div className="p-5 sm:p-8">
            <p className="text-xs font-bold tracking-[0.2em] text-[#e94b25] uppercase mb-3">NGMS / Control · 01</p>
            <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight text-[#111111]">CONTROL.<br /><span className="text-[#777773]">CONNECT. DELIVER.</span></h1>
            <p className="text-sm text-[#454545] mt-4 max-w-xl">Admin command centre for leads, quotes, jobs, website content and business operations.</p>
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-[#222222] p-5 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#555555]">Signed in as</p>
              <p className="text-sm font-semibold break-all text-[#111111] mt-1">{session.user.email}</p>
            </div>
            <button onClick={handleLogout} className="self-start border border-[#222222] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#111111] hover:bg-[#111111] hover:text-white transition inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b border-[#222222] space-y-4">
          <AdminSearch />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <MfaSetup />
            <WeekAheadButton />
          </div>
          <BusinessSummary />
          <LiveVisitors />
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#e94b25] font-bold">02 / Operations</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#111111] mt-1">Business systems</h2>
            </div>
            <p className="hidden sm:block text-xs text-[#555555]">SELECT A MODULE ↗</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-0 border-l border-t border-[#999994]">
            {NAV_ITEMS.map(({ href, icon: Icon, title, desc }, index) => (
              <Link key={href} href={href} className="group min-w-0 border-r border-b border-[#999994] p-4 sm:p-5 bg-[#f4f3ef] hover:bg-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e94b25]">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <span className="text-xs font-bold tracking-widest text-[#e94b25]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="h-9 w-9 flex items-center justify-center border border-[#999994] text-[#111111] group-hover:bg-[#e94b25] group-hover:border-[#e94b25] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <p className="font-heading font-bold text-lg leading-tight text-[#111111]">{title}</p>
                <p className="text-sm leading-relaxed text-[#555555] mt-2">{desc}</p>
                <div className="flex justify-end mt-4 text-[#e94b25] group-hover:translate-x-1 transition-transform" aria-hidden="true">↗</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
