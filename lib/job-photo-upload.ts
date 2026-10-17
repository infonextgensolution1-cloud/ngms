/**
 * Normalize field photos before sending them to Supabase Storage.
 * Large phone/camera images are resized and encoded as JPEG to reduce upload
 * time and make the upload behaviour consistent across the Jobs and Field UIs.
 */
export async function prepareJobPhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file (JPG, PNG or WebP).')
  }
  if (file.size > 30 * 1024 * 1024) {
    throw new Error('This photo is over 30 MB. Please choose a smaller image.')
  }

  // Keep small JPEG/WebP files as-is; still resize large originals and PNGs.
  if (file.size <= 2 * 1024 * 1024 && /image\/(jpeg|webp)/i.test(file.type)) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    if (file.size <= 2 * 1024 * 1024) return file
    throw new Error('This image format could not be prepared by your browser. Save it as JPG or PNG and try again.')
  }

  try {
    const maxEdge = 1920
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Your browser could not prepare this photo. Please try another image.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('Photo compression failed. Please try another image.')),
        'image/jpeg',
        0.82,
      )
    })
    if (blob.size > 8 * 1024 * 1024) {
      throw new Error('The prepared photo is still too large. Please choose a smaller image.')
    }
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'job-photo'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    bitmap.close()
  }
}

/** Bound a stalled network request so the UI always exits its loading state. */
export async function withJobPhotoTimeout<T>(request: Promise<T>, timeoutMs = 60_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      request,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('The photo upload is taking too long. Check your connection and retry.')), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
