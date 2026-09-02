'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client' // adjust path if needed
import { v4 as uuidv4 } from 'uuid'

const SERVICES = [
  { slug: 'solar-panel-cleaning', label: 'Solar Panel Cleaning' },
  { slug: 'painting', label: 'Painting' },
  { slug: 'waterproofing', label: 'Waterproofing' },
  { slug: 'paving', label: 'Paving' },
  { slug: 'plumbing', label: 'Plumbing' },
  { slug: 'electrical', label: 'Electrical Work' },
  { slug: 'pool-fibre-lining', label: 'Pool Fibre Lining' },
  { slug: 'high-pressure-cleaning', label: 'High-Pressure Cleaning' },
  { slug: 'rubble-removal', label: 'Rubble Removal' },
  { slug: 'steelwork-welding', label: 'Steelwork / Welding' },
  { slug: 'handyman', label: 'Handyman Services' },
]

export default function GalleryUpload({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [serviceSlug, setServiceSlug] = useState(SERVICES[0].slug)
  const [sortOrder, setSortOrder] = useState(1)
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
      // 1. Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `\( {uuidv4()}. \){fileExt}`
      const filePath = fileName

      // 2. Upload to Storage bucket "gallery-photos"
      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery-photos')
        .getPublicUrl(filePath)

      // 4. Insert row into gallery_photos table
      const { error: dbError } = await supabase
        .from('gallery_photos')
        .insert({
          image_url: publicUrl,
          caption: caption.trim() || null,
          service_slug: serviceSlug,
          sort_order: sortOrder,
          is_active: true,
        })

      if (dbError) throw dbError

      // Success
      setMessage('Photo published successfully!')
      setFile(null)
      setCaption('')
      setSortOrder(1)
      onSuccess?.()
    } catch (err: any) {
      console.error(err)
      setMessage(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md space-y-4 rounded-lg border p-6 bg-white shadow-sm">
      <h2 className="text-xl font-semibold">Gallery Manager</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Caption</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Solar panels cleaned – Strand"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Service</label>
        <select
          value={serviceSlug}
          onChange={(e) => setServiceSlug(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          {SERVICES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Display order</label>
        <input
          type="number"
          min={1}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Publish Photo'}
      </button>

      {message && (
        <p className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
