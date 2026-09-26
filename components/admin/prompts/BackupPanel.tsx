'use client'

import { useEffect, useRef, useState } from 'react'
import { Cloud, CloudOff, Download, FolderOpen, HardDrive, RefreshCw, Upload } from 'lucide-react'
import {
  GOOGLE_CLIENT_ID,
  canPickFile,
  connectDrive,
  disconnectDrive,
  downloadSnapshot,
  loadFromDrive,
  parseSnapshot,
  pickBackupFile,
  saveToDrive,
  writeToFile,
  type DriveToken,
  type FileHandleLike,
  type Snapshot,
} from '@/lib/prompt-backup'

const KEY_DRIVE = 'ngms.admin.prompts.drive.v1'
const FILE_DELAY = 3000
const DRIVE_DELAY = 20000

interface DrivePrefs {
  enabled: boolean
  fileId: string | null
}

function readPrefs(): DrivePrefs {
  try {
    const raw = window.localStorage.getItem(KEY_DRIVE)
    return raw ? { enabled: false, fileId: null, ...JSON.parse(raw) } : { enabled: false, fileId: null }
  } catch {
    return { enabled: false, fileId: null }
  }
}

function writePrefs(p: DrivePrefs) {
  try {
    window.localStorage.setItem(KEY_DRIVE, JSON.stringify(p))
  } catch {
    /* storage can be blocked */
  }
}

const time = (d: Date) => d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })

/**
 * `data` is the current snapshot; `version` changes whenever anything worth saving changes.
 * Both backup targets autosave after a short pause in typing.
 */
export default function BackupPanel({
  data,
  version,
  onRestore,
}: {
  data: () => Snapshot
  version: string
  onRestore: (snap: Snapshot) => void
}) {
  const dataRef = useRef(data)
  dataRef.current = data

  /* ---- File on this computer ---- */
  const [file, setFile] = useState<FileHandleLike | null>(null)
  const [fileMsg, setFileMsg] = useState('')
  const [pickable, setPickable] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => setPickable(canPickFile()), [])

  const saveFile = async (handle: FileHandleLike) => {
    try {
      await writeToFile(handle, dataRef.current())
      setFileMsg(`Saved to ${handle.name} at ${time(new Date())}`)
    } catch {
      setFile(null)
      setFileMsg('Lost access to the backup file. Choose it again.')
    }
  }

  const chooseFile = async () => {
    try {
      const handle = await pickBackupFile()
      setFile(handle)
      await saveFile(handle)
    } catch {
      /* picker closed */
    }
  }

  useEffect(() => {
    if (!file) return
    const t = window.setTimeout(() => saveFile(file), FILE_DELAY)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, version])

  const importFile = async (f: File | undefined) => {
    if (!f) return
    try {
      const snap = parseSnapshot(await f.text())
      if (window.confirm(`Replace what's on this page with the backup from ${snap.savedAt.slice(0, 16).replace('T', ' ')}?`)) {
        onRestore(snap)
        setFileMsg(`Restored from ${f.name}`)
      }
    } catch (e) {
      setFileMsg(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  /* ---- Google Drive ---- */
  const [prefs, setPrefs] = useState<DrivePrefs>({ enabled: false, fileId: null })
  const [token, setToken] = useState<DriveToken | null>(null)
  const [driveMsg, setDriveMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const lastSaved = useRef<string>('')

  useEffect(() => setPrefs(readPrefs()), [])

  const updatePrefs = (p: DrivePrefs) => {
    setPrefs(p)
    writePrefs(p)
  }

  const live = token && token.expiresAt > Date.now() ? token : null

  const pushDrive = async (t: DriveToken, fileId: string | null) => {
    if (t.expiresAt <= Date.now()) {
      setToken(null)
      setDriveMsg('Google Drive access expired after an hour. Press Reconnect to keep syncing.')
      return
    }
    try {
      const id = await saveToDrive(t.token, dataRef.current(), fileId)
      lastSaved.current = version
      if (id !== fileId) updatePrefs({ enabled: true, fileId: id })
      setDriveMsg(`Synced to Google Drive at ${time(new Date())}`)
    } catch (e) {
      setDriveMsg(e instanceof Error ? e.message : 'Google Drive save failed.')
      if (e instanceof Error && e.message.includes('expired')) setToken(null)
    }
  }

  const connect = async () => {
    setBusy(true)
    try {
      const t = await connectDrive()
      setToken(t)
      updatePrefs({ enabled: true, fileId: prefs.fileId })
      await pushDrive(t, prefs.fileId)
    } catch (e) {
      setDriveMsg(e instanceof Error ? e.message : 'Google sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  const disconnect = () => {
    if (token) disconnectDrive(token.token)
    setToken(null)
    updatePrefs({ enabled: false, fileId: prefs.fileId })
    setDriveMsg('Google Drive sync is off. The backup file stays in your Drive.')
  }

  const restoreDrive = async () => {
    if (!live) return
    setBusy(true)
    try {
      const { id, snap } = await loadFromDrive(live.token, prefs.fileId)
      updatePrefs({ enabled: true, fileId: id })
      if (window.confirm(`Replace what's on this page with the Drive backup from ${snap.savedAt.slice(0, 16).replace('T', ' ')}?`)) {
        onRestore(snap)
        setDriveMsg('Restored from Google Drive')
      }
    } catch (e) {
      setDriveMsg(e instanceof Error ? e.message : 'Could not read the Drive backup.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!live || version === lastSaved.current) return
    const t = window.setTimeout(() => pushDrive(live, prefs.fileId), DRIVE_DELAY)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.token, version])

  return (
    <section className="pd-panel" aria-labelledby="pd-backup-title">
      <div className="pd-panel-head">
        <div>
          <h2 id="pd-backup-title">Backup and sync</h2>
          <p>
            Everything you type here (saved prompts, unsaved edits, field values, your combo) autosaves on this device
            as you go. Add a file on your computer or Google Drive so it survives a cleared browser or a new laptop.
          </p>
        </div>
      </div>

      <div className="pd-backup-grid">
        <div className="pd-backup-card">
          <div className="pd-gen-top">
            <HardDrive size={20} aria-hidden="true" />
            <h3>File on this computer</h3>
          </div>
          <p className="pd-gen-best">
            {pickable
              ? 'Pick a file once and the page keeps it up to date while this tab is open. After a reload, pick the same file again.'
              : 'This browser cannot keep writing to a file. Download a backup instead (Chrome or Edge can autosave).'}
          </p>
          <div className="pd-row-actions">
            {pickable && (
              <button className="pd-btn" onClick={chooseFile}>
                <FolderOpen size={16} aria-hidden="true" /> {file ? 'Change file' : 'Autosave to a file'}
              </button>
            )}
            <button className="pd-btn" onClick={() => downloadSnapshot(dataRef.current())}>
              <Download size={16} aria-hidden="true" /> Download backup
            </button>
            <button className="pd-btn pd-btn-quiet" onClick={() => importRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> Restore from file
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                importFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          <p className="pd-backup-status" aria-live="polite">
            {fileMsg || (file ? `Autosaving to ${file.name}` : 'No file chosen')}
          </p>
        </div>

        <div className="pd-backup-card">
          <div className="pd-gen-top">
            {live ? <Cloud size={20} aria-hidden="true" /> : <CloudOff size={20} aria-hidden="true" />}
            <h3>Google Drive</h3>
            {live && <span className="pd-tag">Syncing</span>}
          </div>
          {GOOGLE_CLIENT_ID ? (
            <>
              <p className="pd-gen-best">
                Saves one file, NGMS-prompt-dashboard-backup.json, to your Drive about 20 seconds after you stop typing.
                The page can only see that file. Google asks you to reconnect after an hour.
              </p>
              <div className="pd-row-actions">
                {live ? (
                  <>
                    <button className="pd-btn" disabled={busy} onClick={() => pushDrive(live, prefs.fileId)}>
                      <RefreshCw size={16} aria-hidden="true" /> Sync now
                    </button>
                    <button className="pd-btn pd-btn-quiet" disabled={busy} onClick={restoreDrive}>
                      <Upload size={16} aria-hidden="true" /> Restore from Drive
                    </button>
                    <button className="pd-btn pd-btn-quiet" onClick={disconnect}>
                      Turn off
                    </button>
                  </>
                ) : (
                  <button className="pd-btn pd-btn-primary" disabled={busy} onClick={connect}>
                    <Cloud size={16} aria-hidden="true" /> {prefs.enabled ? 'Reconnect Google Drive' : 'Connect Google Drive'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="pd-gen-best">
              Not set up yet. Create a Google OAuth client ID (Web application, with this site as an authorised
              JavaScript origin), add it in Vercel as <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>, then redeploy. The
              steps are at the top of <code>lib/prompt-backup.ts</code>.
            </p>
          )}
          <p className="pd-backup-status" aria-live="polite">
            {driveMsg || (prefs.enabled && !live ? 'Drive sync paused until you reconnect.' : 'Not connected')}
          </p>
        </div>
      </div>
    </section>
  )
}
