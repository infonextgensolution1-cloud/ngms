import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { quotePhotoRef, QUOTE_PHOTO_BUCKET } from '@/lib/quote-photo'

export const runtime = 'nodejs'

const MAX_BYTES = 3 * 1024 * 1024 // client compresses to ~1MB; Vercel body limit is 4.5MB
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Uploads a quote-request photo to the PRIVATE public-leads bucket and returns a
// storage reference (lib/quote-photo.ts) — staff view it through a signed URL.
export async function POST(req: Request) {
  if (!rateLimit(`photo:${clientIp(req)}`, 6)) {
    return NextResponse.json({ ok: false, error: 'Too many uploads, try again later.' }, { status: 429 })
  }
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload' }, { status: 400 })
  }
  const file = form.get('photo')
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'No photo' }, { status: 400 })
  const ext = TYPES[file.type]
  if (!ext) return NextResponse.json({ ok: false, error: 'Use a JPG, PNG or WebP photo' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Photo too large' }, { status: 413 })

  // Validate the file signature as well as the MIME type so a renamed executable/text
  // file cannot be uploaded through the public endpoint.
  const bytes = new Uint8Array(await file.arrayBuffer())
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  if ((file.type === 'image/jpeg' && !isJpeg) || (file.type === 'image/png' && !isPng) || (file.type === 'image/webp' && !isWebp)) {
    return NextResponse.json({ ok: false, error: 'Invalid image file' }, { status: 415 })
  }

  try {
    const db = supabaseAdmin()
    const path = `quote-photos/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`
    const { error } = await db.storage.from(QUOTE_PHOTO_BUCKET).upload(path, Buffer.from(bytes), {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error
    return NextResponse.json({ ok: true, url: quotePhotoRef(path) })
  } catch (err) {
    console.error('quote-photo upload failed:', err)
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 })
  }
}
