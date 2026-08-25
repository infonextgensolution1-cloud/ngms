'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { services } from '@/lib/services'

type Slide = {
  id: string
  image_url: string
  alt_text: string
  caption: string | null
  sort_order: number
  is_active: boolean
}

type BeforeAfter = {
  id: string
  service_slug: string | null
  location: string
  caption: string | null
  before_image_url: string
  after_image_url: string
  is_active: boolean
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Hero slides
  const [slides, setSlides] = useState<Slide[]>([])
  const [slideCaption, setSlideCaption] = useState('')
  const [uploadingSlide, setUploadingSlide] = useState(false)

  // Before & after
  const [items, setItems] = useState<BeforeAfter[]>([])
  const [baLocation, setBaLocation] = useState('')
  const [baService, setBaService] = useState(services[0].slug)
  const [baCaption, setBaCaption] = useState('')
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [uploadingBA, setUploadingBA] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, newSession) => setSession(newSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetchSlides()
      fetchBeforeAfter()
    }
  }, [session])

  async function fetchSlides() {
    const { data, error } = await supabase.from('hero_slides').select('*').order('sort_order')
    if (error) console.error(error)
    setSlides((data as Slide[]) ?? [])
  }

  async function fetchBeforeAfter() {
    const { data, error } = await supabase.from('before_after_photos').select('*').order('sort_order')
    if (error) console.error(error)
    setItems((data as BeforeAfter[]) ?? [])
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

  async function handleSlideUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSlide(true)
    const path = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('hero-slides').upload(path, file)
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploadingSlide(false)
      return
    }
    const { data: urlData } = supabase.storage.from('hero-slides').getPublicUrl(path)
    const { error: insertError } = await supabase.from('hero_slides').insert({
      image_url: urlData.publicUrl,
      alt_text: file.name,
      caption: slideCaption || null,
      sort_order: slides.length,
      is_active: true,
    })
    if (insertError) alert('Save failed: ' + insertError.message)
    await fetchSlides()
    setSlideCaption('')
    setUploadingSlide(false)
    e.target.value = ''
  }

  async function toggleSlide(slide: Slide) {
    await supabase.from('hero_slides').update({ is_active: !slide.is_active }).eq('id', slide.id)
    await fetchSlides()
  }

  async function deleteSlide(slide: Slide) {
    if (!confirm('Delete this slide?')) return
    await supabase.from('hero_slides').delete().eq('id', slide.id)
    await fetchSlides()
  }

  async function handleBeforeAfterUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!beforeFile || !afterFile || !baLocation) {
      alert('Please add a location, a before photo and an after photo.')
      return
    }
    setUploadingBA(true)
    try {
      const beforePath = `${Date.now()}-before-${beforeFile.name}`
      const afterPath = `${Date.now()}-after-${afterFile.name}`

      const { error: beforeErr } = await supabase.storage.from('before-after-photos').upload(beforePath, beforeFile)
      if (beforeErr) throw beforeErr
      const { error: afterErr } = await supabase.storage.from('before-after-photos').upload(afterPath, afterFile)
      if (afterErr) throw afterErr

      const beforeUrl = supabase.storage.from('before-after-photos').getPublicUrl(beforePath).data.publicUrl
      const afterUrl = supabase.storage.from('before-after-photos').getPublicUrl(afterPath).data.publicUrl

      const { error: insertErr } = await supabase.from('before_after_photos').insert({
        service_slug: baService,
        location: baLocation,
        caption: baCaption || null,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        sort_order: items.length,
        is_active: true,
      })
      if (insertErr) throw insertErr

      await fetchBeforeAfter()
      setBaLocation('')
      setBaCaption('')
      setBeforeFile(null)
      setAfterFile(null)
      ;(document.getElementById('before-file-input') as HTMLInputElement).value = ''
      ;(document.getElementById('after-file-input') as HTMLInputElement).value = ''
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message ?? 'unknown error'))
    } finally {
      setUploadingBA(false)
    }
  }

  async function toggleBA(item: BeforeAfter) {
    await supabase.from('before_after_photos').update({ is_active: !item.is_active }).eq('id', item.id)
    await fetchBeforeAfter()
  }

  async function deleteBA(item: BeforeAfter) {
    if (!confirm('Delete this before/after pair?')) return
    await supabase.from('before_after_photos').delete().eq('id', item.id)
    await fetchBeforeAfter()
  }

  const inputClass = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3'

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
          <h1 className="font-heading font-bold text-paper text-center mb-2">NGSMS Admin</h1>
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          {loginError && <p className="text-orange text-sm">{loginError}</p>}
          <button type="submit" className="w-full bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            Log In
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="bg-jet min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-heading text-2xl font-bold text-paper">NGSMS Admin</h1>
          <button onClick={handleLogout} className="text-mist hover:text-orange text-sm font-semibold">
            Log out
          </button>
        </div>

        {/* HERO SLIDES */}
        <section className="mb-14">
          <h2 className="font-heading text-xl font-bold text-paper mb-4">Hero Slides</h2>
          <div className="bg-cardgrey border border-darkgrey rounded-card p-6 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1 text-paper font-heading">Description (optional)</label>
              <input
                value={slideCaption}
                onChange={(e) => setSlideCaption(e.target.value)}
                placeholder="e.g. Solar cleaning at Engen Touws River"
                className={inputClass}
              />
            </div>
            <label className="block border border-dashed border-darkgrey rounded-btn p-6 text-center text-mist cursor-pointer hover:border-orange transition">
              {uploadingSlide ? 'Uploading...' : 'Click to choose a hero slide image (uploads immediately)'}
              <input type="file" accept="image/*" onChange={handleSlideUpload} className="hidden" disabled={uploadingSlide} />
            </label>
          </div>

          <div className="space-y-3">
            {slides.map((slide) => (
              <div key={slide.id} className="bg-cardgrey border border-darkgrey rounded-card p-4 flex items-center gap-4">
                <img src={slide.image_url} alt={slide.alt_text} className="h-16 w-24 object-cover rounded-btn shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-paper text-sm font-semibold truncate">{slide.caption || slide.alt_text}</p>
                  <p className="text-mist text-xs">{slide.is_active ? 'Active' : 'Hidden'}</p>
                </div>
                <button onClick={() => toggleSlide(slide)} className="text-blue text-sm font-semibold shrink-0">
                  {slide.is_active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => deleteSlide(slide)} className="text-orange text-sm font-semibold shrink-0">
                  Delete
                </button>
              </div>
            ))}
            {slides.length === 0 && <p className="text-mist text-sm">No slides yet.</p>}
          </div>
        </section>

        {/* BEFORE & AFTER */}
        <section>
          <h2 className="font-heading text-xl font-bold text-paper mb-4">Before &amp; After Photos</h2>
          <form onSubmit={handleBeforeAfterUpload} className="bg-cardgrey border border-darkgrey rounded-card p-6 mb-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Service</label>
                <select value={baService} onChange={(e) => setBaService(e.target.value)} className={inputClass}>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Location</label>
                <input
                  required
                  value={baLocation}
                  onChange={(e) => setBaLocation(e.target.value)}
                  placeholder="e.g. Somerset West"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-paper font-heading">Description (optional)</label>
              <input
                value={baCaption}
                onChange={(e) => setBaCaption(e.target.value)}
                placeholder="e.g. Full roof waterproofing, completed in 2 days"
                className={inputClass}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">Before photo</label>
                <input
                  id="before-file-input"
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-paper font-heading">After photo</label>
                <input
                  id="after-file-input"
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={uploadingBA}
              className="w-full bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn disabled:opacity-50"
            >
              {uploadingBA ? 'Uploading...' : 'Upload Before & After'}
            </button>
          </form>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-cardgrey border border-darkgrey rounded-card p-4 flex items-center gap-4">
                <div className="flex gap-1 shrink-0">
                  <img src={item.before_image_url} alt="Before" className="h-16 w-16 object-cover rounded-btn" />
                  <img src={item.after_image_url} alt="After" className="h-16 w-16 object-cover rounded-btn" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-paper text-sm font-semibold truncate">{item.location}</p>
                  <p className="text-mist text-xs truncate">{item.caption || item.service_slug}</p>
                  <p className="text-mist text-xs">{item.is_active ? 'Active' : 'Hidden'}</p>
                </div>
                <button onClick={() => toggleBA(item)} className="text-blue text-sm font-semibold shrink-0">
                  {item.is_active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => deleteBA(item)} className="text-orange text-sm font-semibold shrink-0">
                  Delete
                </button>
              </div>
            ))}
            {items.length === 0 && <p className="text-mist text-sm">No before/after pairs yet.</p>}
          </div>
        </section>
      </div>
    </main>
  )
}
