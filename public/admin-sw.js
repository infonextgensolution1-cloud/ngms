// NGMS Admin offline support.
//
// Registered only from /admin pages. It saves what you open so it can be viewed
// with no signal:
//   - admin pages: network first, fall back to the saved copy
//   - Next.js build files (/_next/static): saved once, they never change
//   - Supabase data reads (GET /rest/v1): network first, fall back to the saved copy
// Anything that changes data (POST/PATCH/DELETE), sign-in, and every public
// website page goes straight to the network untouched.
// Saved data is wiped when you sign out (see components/admin/AdminApp.tsx).

const VERSION = 'v1'
const PAGES = `ngms-admin-pages-${VERSION}`
const STATIC = `ngms-admin-static-${VERSION}`
const DATA = 'ngms-admin-data'
const SUPABASE_HOST = 'dfwwpqtsbaytfqptancj.supabase.co'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES).then((c) => c.addAll(['/admin'])).catch(() => {}).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ngms-admin-') && ![PAGES, STATIC, DATA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'clear-data') event.waitUntil(caches.delete(DATA))
})

const OFFLINE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · NGMS Admin</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0A;color:#F5F5F5;font:16px/1.5 system-ui,sans-serif;padding:24px;text-align:center}a{color:#F57C1B}</style></head>
<body><div><h1 style="font-size:22px">You're offline</h1><p style="color:#A3A3A3">This screen hasn't been opened on this phone yet, so there's no saved copy.<br>Screens you've opened before still work.</p><p><a href="/admin">Back to the dashboard</a></p></div></body></html>`

async function networkFirst(request, cacheName, offlinePage) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (err) {
    const saved = await cache.match(request, { ignoreVary: true })
    if (saved) return saved
    // Never substitute another record's page: its data would show under this URL.
    if (offlinePage) return new Response(OFFLINE_PAGE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    throw err
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC)
  const saved = await cache.match(request)
  if (saved) return saved
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/admin-app/')) {
      event.respondWith(cacheFirst(request))
    } else if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      // Page loads and Next.js route data for admin screens.
      event.respondWith(networkFirst(request, PAGES, request.mode === 'navigate'))
    }
    return
  }

  if (url.hostname === SUPABASE_HOST && url.pathname.startsWith('/rest/v1/')) {
    event.respondWith(networkFirst(request, DATA))
  }
})
