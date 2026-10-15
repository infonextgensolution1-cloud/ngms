export function jobPhotoStoragePath(value: string): string | null {
  const input = value.trim()
  if (!input) return null
  try {
    if (!/^https?:\/\//i.test(input)) {
      if (input.startsWith('job-photos/')) return input.slice('job-photos/'.length)
      return input.startsWith('/') ? null : input
    }
    const url = new URL(input)
    const markers = [
      '/storage/v1/object/public/job-photos/',
      '/storage/v1/object/sign/job-photos/',
      '/storage/v1/object/authenticated/job-photos/',
    ]
    const marker = markers.find((item) => url.pathname.includes(item))
    if (!marker) return null
    return decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length))
  } catch {
    return null
  }
}
