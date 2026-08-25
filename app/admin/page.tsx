'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

type Slide = {
  id: string
  image_url: string
  alt_text: string
  caption: string | null
  sort_order: number
  is_active: boolean
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [slides, setSlides] = useState<Slide[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) fetchSlides()
  }, [session])

  async function fetchSlides() {
    const { data } = await supabase.from('hero_slides').select('*').order('sort_order')
    setSlides((data as Slide[]) ?? [])
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('hero-slides').upload(path, file)
    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('hero-slides').getPublicUrl(path)
    await supabase.from('hero_slides').insert({
      image_url: urlData.publicUrl,
      alt_text: file.name,
      sort_order: slides.length,
      is_active: true,
    })
    await fetchSlides()
    setUploading(false)
    e.target.value = ''
  }

  async function toggleActive(slide: Slide) {
    await supabase.from('hero_slides').update({ is_active: !slide.is_active }).eq('id', slide.id)
    await fetchSlides()
  }

  async function deleteSlide(slide: Slide) {
    if (!confirm('Delete this slide?')) return
    await supabase.from('hero_slides').delete().eq('id', slide.id)
    await fetchSlides()
  }

  if (checking) {
    return (
      <main className="bg-jet min-h-screen flex items-center justify-center">
        <p className="text-mist">Loading...</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="bg-jet min-h-screen flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-cardgrey border border-darkgrey rounded-card p-8 w-full max-w-sm space-y-4">
          <h1 className="font-heading text-2xl font-bold text-paper text-center mb-2">NGSMS Admin</h1>
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3"
            />
          </div>
          {loginError && <p className="text-orange text-sm">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn"
          >
            Log In
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="bg-jet min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-2xl font-bold text-paper">Hero Slides</h1>
          <button onClick={handleLogout} className="text-mist hover:text-orange text-sm font-semibold">
            Log out
          </button>
        </div>

        <label className="block bg-cardgrey border border-dashed border-darkgrey rounded-card p-8 text-center text-mist cursor-pointer mb-8 hover:border-orange transition">
          {uploading ? 'Uploading...' : 'Click to upload a new hero slide image'}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>

        <div className="space-y-4">
          {slides.map((slide) => (
            <div key={slide.id} className="bg-cardgrey border border-darkgrey rounded-card p-4 flex items-center gap-4">
              <img src={slide.image_url} alt={slide.alt_text} className="h-16 w-24 object-cover rounded-btn shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-paper text-sm font-semibold truncate">{slide.alt_text}</p>
                <p className="text-mist text-xs">{slide.is_active ? 'Active' : 'Hidden'}</p>
              </div>
              <button onClick={() => toggleActive(slide)} className="text-blue text-sm font-semibold shrink-0">
                {slide.is_active ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => deleteSlide(slide)} className="text-orange text-sm font-semibold shrink-0">
                Delete
              </button>
            </div>
          ))}
          {slides.length === 0 && <p className="text-mist text-sm">No slides yet — upload one above.</p>}
        </div>
      </div>
    </main>
  )
}
