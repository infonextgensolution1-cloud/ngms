'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { services } from '@/lib/services'

export default function GalleryUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [serviceSlug, setServiceSlug] = useState(services[0].slug)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleUpload() {
    if (!file) {
      setMessage('Please select an image first')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('gallery_photos').insert({
        image_url: publicUrl,
        caption: caption.trim() || null,
        service_slug: serviceSlug,
        sort_order: 0,
        is_active: true,
      })
      if (dbError) throw dbError

      setMessage('Photo published successfully!')
      setFile(null)
      setCaption('')
      onSuccess?.()
    } catch (err: any) {
      console.error(err)
      setMessage(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const inputClass = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3'

  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-6 space-y-4">
      <div>
        <label className="block text-sm font-bold mb-1 text-paper font-heading">Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1 text-paper font-heading">Caption</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Solar panels cleaned – Strand"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1 text-paper font-heading">Service</label>
        <select value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} className={inputClass}>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Publish Photo'}
      </button>

      {message && (
        <p className={`text-sm ${message.startsWith('Error') ? 'text-orange' : 'text-whatsapp'}`}>{message}</p>
      )}
    </div>
  )
}
