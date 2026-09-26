// Backups for the admin Prompt Dashboard: a JSON snapshot of everything the owner has typed,
// written to (1) a file on this computer and (2) Google Drive. The dashboard itself autosaves to
// localStorage; these are the copies that survive a cleared browser or a new laptop.
//
// Google Drive setup (one-off):
//   1. console.cloud.google.com → new project → enable "Google Drive API".
//   2. OAuth consent screen: External, add info.nextgensolution1@gmail.com as a test user (or publish).
//   3. Credentials → OAuth client ID → Web application. Authorised JavaScript origins:
//      https://<your live domain> and http://localhost:3000.
//   4. Put the client ID in Vercel as NEXT_PUBLIC_GOOGLE_CLIENT_ID and redeploy.
// Scope is drive.file: the page can only see the backup file it created, nothing else in Drive.

export interface Snapshot {
  app: 'ngms-prompt-dashboard'
  version: 1
  savedAt: string
  saved: Record<string, string>
  drafts: Record<string, string>
  vars: Record<string, string>
  combo: string[]
  ctx: { service: string; area: string; header: boolean }
}

export const BACKUP_NAME = 'NGMS-prompt-dashboard-backup.json'

export function parseSnapshot(text: string): Snapshot {
  const data = JSON.parse(text)
  if (!data || data.app !== 'ngms-prompt-dashboard' || data.version !== 1) {
    throw new Error('This is not an NGMS Prompt Dashboard backup file.')
  }
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {})
  return {
    app: data.app,
    version: 1,
    savedAt: String(data.savedAt ?? ''),
    saved: obj(data.saved),
    drafts: obj(data.drafts),
    vars: obj(data.vars),
    combo: Array.isArray(data.combo) ? data.combo.filter((x: unknown) => typeof x === 'string') : [],
    ctx: {
      service: String(data.ctx?.service ?? ''),
      area: String(data.ctx?.area ?? ''),
      header: data.ctx?.header !== false,
    },
  }
}

/* ---------- File on this computer ---------- */

// Chrome and Edge can keep writing to one chosen file (File System Access API).
// Other browsers fall back to a plain download.

interface WritableLike {
  write: (data: string) => Promise<void>
  close: () => Promise<void>
}
export interface FileHandleLike {
  name: string
  createWritable: () => Promise<WritableLike>
}

type SavePicker = (opts: unknown) => Promise<FileHandleLike>

export function canPickFile(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

export async function pickBackupFile(): Promise<FileHandleLike> {
  const picker = (window as unknown as { showSaveFilePicker: SavePicker }).showSaveFilePicker
  return picker({
    suggestedName: BACKUP_NAME,
    types: [{ description: 'NGMS backup', accept: { 'application/json': ['.json'] } }],
  })
}

export async function writeToFile(handle: FileHandleLike, snap: Snapshot) {
  const w = await handle.createWritable()
  await w.write(JSON.stringify(snap, null, 2))
  await w.close()
}

export function downloadSnapshot(snap: Snapshot) {
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `NGMS-prompts-${snap.savedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ---------- Google Drive ---------- */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GSI_SRC = 'https://accounts.google.com/gsi/client'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void
}
interface GoogleOAuth {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string
        scope: string
        callback: (r: TokenResponse) => void
        error_callback?: (e: { type?: string; message?: string }) => void
      }) => TokenClient
      revoke: (token: string, done?: () => void) => void
    }
  }
}

let gsiLoading: Promise<void> | null = null

function loadGsi(): Promise<void> {
  if ((window as unknown as { google?: GoogleOAuth }).google?.accounts?.oauth2) return Promise.resolve()
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = GSI_SRC
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => {
        gsiLoading = null
        reject(new Error('Could not load Google sign-in. Check your connection.'))
      }
      document.head.appendChild(s)
    })
  }
  return gsiLoading
}

export interface DriveToken {
  token: string
  expiresAt: number
}

/** Opens Google's consent popup. Call it straight from a click so the popup is not blocked. */
export async function connectDrive(silent = false): Promise<DriveToken> {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google Drive is not set up yet (NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing).')
  await loadGsi()
  const google = (window as unknown as { google: GoogleOAuth }).google
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) reject(new Error(r.error || 'Google did not return access.'))
        else resolve({ token: r.access_token, expiresAt: Date.now() + ((r.expires_in ?? 3600) - 60) * 1000 })
      },
      error_callback: (e) => reject(new Error(e.message || e.type || 'Google sign-in was closed.')),
    })
    client.requestAccessToken(silent ? { prompt: '' } : undefined)
  })
}

export function disconnectDrive(token: string) {
  const google = (window as unknown as { google?: GoogleOAuth }).google
  google?.accounts?.oauth2?.revoke(token)
}

async function drive(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  })
  if (res.status === 401) throw new Error('Google Drive access expired. Press Reconnect.')
  return res
}

async function findBackup(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${BACKUP_NAME}' and trashed=false`)
  const res = await drive(
    token,
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&orderBy=modifiedTime desc&fields=files(id)`,
  )
  if (!res.ok) throw new Error(`Google Drive search failed (${res.status}).`)
  const data = (await res.json()) as { files?: { id: string }[] }
  return data.files?.[0]?.id ?? null
}

/** Creates the backup file on first run, then overwrites it. Returns the Drive file id. */
export async function saveToDrive(token: string, snap: Snapshot, knownId: string | null): Promise<string> {
  const body = JSON.stringify(snap, null, 2)
  const id = knownId ?? (await findBackup(token))

  if (id) {
    const res = await drive(token, `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (res.ok) return id
    if (res.status !== 404) throw new Error(`Google Drive save failed (${res.status}).`)
    // The file was deleted in Drive: fall through and create a new one.
  }

  const boundary = 'ngms' + Math.random().toString(36).slice(2)
  const meta = JSON.stringify({ name: BACKUP_NAME, mimeType: 'application/json' })
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`
  const res = await drive(token, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  })
  if (!res.ok) throw new Error(`Google Drive save failed (${res.status}).`)
  return ((await res.json()) as { id: string }).id
}

export async function loadFromDrive(token: string, knownId: string | null): Promise<{ id: string; snap: Snapshot }> {
  const id = knownId ?? (await findBackup(token))
  if (!id) throw new Error('No backup found in Google Drive yet.')
  const res = await drive(token, `https://www.googleapis.com/drive/v3/files/${id}?alt=media`)
  if (!res.ok) throw new Error(`Could not read the Drive backup (${res.status}).`)
  return { id, snap: parseSnapshot(await res.text()) }
}
