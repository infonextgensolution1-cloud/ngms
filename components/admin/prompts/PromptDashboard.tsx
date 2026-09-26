'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Megaphone,
  MessageCircle,
  PhoneCall,
  Plus,
  Receipt,
  RotateCcw,
  Save,
  Star,
  Target,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  AREAS,
  CATEGORIES,
  CONTEXT_HEADER,
  SERVICES,
  VARIABLES,
  extractVars,
  fillTemplate,
  type Category,
  type PromptItem,
} from '@/lib/prompt-library'
import './prompt-dashboard.css'

/* ---------- Static lookups ---------- */

const ICONS: Record<string, LucideIcon> = {
  FileText,
  Receipt,
  Calculator,
  Megaphone,
  Image: ImageIcon,
  Target,
  PhoneCall,
  CalendarDays,
  Star,
  Globe,
  Building2,
  MessageCircle,
}

interface Ref {
  cat: Category
  item: PromptItem
}

const INDEX = new Map<string, Ref>()
CATEGORIES.forEach((cat) => cat.prompts.forEach((item) => INDEX.set(item.id, { cat, item })))
const TOTAL_PROMPTS = INDEX.size

type View = 'dashboard' | 'saved' | 'combo'

const KEY_SAVED = 'ngms.admin.prompts.saved.v1'
const KEY_CTX = 'ngms.admin.prompts.ctx.v1'

/* ---------- Browser storage (per-device convenience only) ---------- */

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function store(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage can be blocked; the page still works without it */
  }
}

/* ---------- Copy helper with manual fallback ---------- */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  } catch {
    return false
  }
}

interface Status {
  kind: 'ok' | 'warn'
  msg: string
}

function useCopy() {
  const [status, setStatus] = useState<Status | null>(null)
  const [manual, setManual] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const send = async (text: string, okMsg: string) => {
    const done = await copyText(text)
    window.clearTimeout(timer.current)
    if (done) {
      setManual(null)
      setStatus({ kind: 'ok', msg: okMsg })
      timer.current = window.setTimeout(() => setStatus(null), 2600)
    } else {
      setManual(text)
      setStatus({
        kind: 'warn',
        msg: 'Copying is blocked in this browser. The text is selected below: press Ctrl+C (or Cmd+C).',
      })
    }
  }

  const clear = () => {
    window.clearTimeout(timer.current)
    setStatus(null)
    setManual(null)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { status, manual, send, clear }
}

function CopyNotice({ copy, variant }: { copy: ReturnType<typeof useCopy>; variant: 'modal' | 'panel' }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (copy.manual !== null && ref.current) {
      ref.current.focus()
      ref.current.select()
    }
  }, [copy.manual])

  return (
    <>
      <div aria-live="polite" className="pd-live" data-variant={variant}>
        {copy.status && (
          <p className="pd-notice" data-kind={copy.status.kind}>
            {copy.status.msg}
          </p>
        )}
      </div>
      {copy.manual !== null && (
        <textarea
          id={`pd-manual-${variant}`}
          ref={ref}
          className="pd-manual"
          data-variant={variant}
          readOnly
          value={copy.manual}
          aria-label="Text to copy"
        />
      )}
    </>
  )
}

/* ---------- Modal shell (no extra dependencies) ---------- */

function ModalShell({
  labelId,
  descId,
  accentLabel,
  onClose,
  children,
}: {
  labelId: string
  descId: string
  accentLabel: string
  onClose: () => void
  children: React.ReactNode
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const box = boxRef.current
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    box?.focus()

    const focusables = () =>
      Array.from(
        box?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === box)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="pd-portal" data-label={accentLabel}>
      <div className="pd-overlay" onClick={() => closeRef.current()} aria-hidden="true" />
      <div
        ref={boxRef}
        className="pd-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descId}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}

/* ---------- Form pieces ---------- */

function SelectBox({
  id,
  value,
  options,
  onChange,
  label,
}: {
  id: string
  value: string
  options: readonly string[]
  onChange: (v: string) => void
  label?: string
}) {
  return (
    <div className="pd-select">
      <select id={id} value={value} aria-label={label} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </div>
  )
}

function Fields({
  names,
  values,
  onChange,
  prefix,
}: {
  names: string[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  prefix: string
}) {
  return (
    <div className="pd-fields">
      {names.map((name) => {
        const id = `${prefix}-${name}`
        if (name === 'service') {
          return (
            <div className="pd-field" key={name}>
              <label htmlFor={id}>Service</label>
              <SelectBox id={id} value={values.service} options={SERVICES} onChange={(v) => onChange(name, v)} />
            </div>
          )
        }
        if (name === 'area') {
          return (
            <div className="pd-field" key={name}>
              <label htmlFor={id}>Area</label>
              <SelectBox id={id} value={values.area} options={AREAS} onChange={(v) => onChange(name, v)} />
            </div>
          )
        }
        const meta = VARIABLES[name] ?? { label: name.replace(/_/g, ' '), placeholder: '' }
        return (
          <div className="pd-field" key={name}>
            <label htmlFor={id}>{meta.label}</label>
            {meta.long ? (
              <textarea
                id={id}
                value={values[name] ?? ''}
                placeholder={meta.placeholder}
                onChange={(e) => onChange(name, e.target.value)}
              />
            ) : (
              <input
                id={id}
                type="text"
                value={values[name] ?? ''}
                placeholder={meta.placeholder}
                onChange={(e) => onChange(name, e.target.value)}
                autoComplete="off"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Prompt modal ---------- */

interface ModalProps {
  id: string
  values: Record<string, string>
  onValue: (name: string, value: string) => void
  ctxHeader: boolean
  onCtxHeader: (v: boolean) => void
  savedTemplate: string | undefined
  onSave: (id: string, template: string) => void
  onReset: (id: string) => void
  inCombo: boolean
  onToggleCombo: (id: string) => void
  onClose: () => void
}

function PromptModal(p: ModalProps) {
  const { cat, item } = INDEX.get(p.id)!
  const current = p.savedTemplate ?? item.template
  const [draft, setDraft] = useState(current)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const copy = useCopy()

  const names = useMemo(() => extractVars(draft), [draft])
  const emptyCount = names.filter((n) => !(p.values[n] ?? '').trim()).length
  const dirty = draft !== current
  const changedFromDefault = draft !== item.template || p.savedTemplate !== undefined
  const output = (p.ctxHeader ? CONTEXT_HEADER + '\n\n' : '') + fillTemplate(draft, p.values)

  const stateText = dirty
    ? 'Unsaved changes'
    : p.savedTemplate !== undefined
      ? 'Your saved version'
      : emptyCount > 0
        ? `${emptyCount} field${emptyCount === 1 ? '' : 's'} still empty`
        : 'Ready to copy'

  const exportJson = () =>
    JSON.stringify(
      {
        id: item.id,
        category: cat.title,
        prompt: item.label,
        service: p.values.service,
        area: p.values.area,
        template: draft,
        filled: output,
      },
      null,
      2,
    )

  const exportMarkdown = () => `## ${cat.title}: ${item.label}\n\n${output}\n`

  return (
    <ModalShell labelId="pd-dlg-title" descId="pd-dlg-desc" accentLabel={cat.title} onClose={p.onClose}>
      <header className="pd-dlg-head">
        <div>
          <p className="pd-eyebrow">{cat.title}</p>
          <h2 id="pd-dlg-title">{item.label}</h2>
          <p id="pd-dlg-desc" className="pd-sr">
            Fill in the details, edit the template if you want to, then copy the finished prompt.
          </p>
        </div>
        <button className="pd-icon-btn" onClick={p.onClose} aria-label="Close">
          <X size={18} />
        </button>
      </header>

      <div className="pd-dlg-body">
        <section aria-label="Details">
          <h3 className="pd-mini">Fill in</h3>
          <div className="pd-fields">
            <Fields names={names} values={p.values} onChange={p.onValue} prefix="pd-m" />
            <label className="pd-check" htmlFor="pd-m-ctx">
              <input
                id="pd-m-ctx"
                type="checkbox"
                checked={p.ctxHeader}
                onChange={(e) => p.onCtxHeader(e.target.checked)}
              />
              Add NGMS context line
            </label>
          </div>
        </section>

        <section className="pd-dlg-main" aria-label="Prompt">
          <div className="pd-tabs" role="tablist" aria-label="Prompt view">
            <button
              id="pd-tab-edit"
              role="tab"
              aria-selected={tab === 'edit'}
              aria-controls="pd-panel-prompt"
              onClick={() => setTab('edit')}
            >
              Edit template
            </button>
            <button
              id="pd-tab-preview"
              role="tab"
              aria-selected={tab === 'preview'}
              aria-controls="pd-panel-prompt"
              onClick={() => setTab('preview')}
            >
              Ready to paste
            </button>
          </div>
          <div
            id="pd-panel-prompt"
            role="tabpanel"
            aria-labelledby={tab === 'edit' ? 'pd-tab-edit' : 'pd-tab-preview'}
          >
            {tab === 'edit' ? (
              <textarea
                id="pd-m-editor"
                className="pd-editor"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                aria-label="Prompt template"
              />
            ) : (
              <textarea
                id="pd-m-preview"
                className="pd-editor pd-preview"
                value={output}
                readOnly
                aria-label="Finished prompt"
              />
            )}
          </div>
          <p className="pd-hint">
            Write <code>{'{{field_name}}'}</code> anywhere in the template to add a field. Empty fields show as
            [brackets] in the finished prompt.
          </p>
        </section>
      </div>

      <CopyNotice copy={copy} variant="modal" />

      <footer className="pd-dlg-foot">
        <span className="pd-state" data-tone={dirty || emptyCount > 0 ? 'warn' : undefined}>
          {stateText}
        </span>
        {changedFromDefault && (
          <button
            className="pd-btn pd-btn-quiet"
            onClick={() => {
              setDraft(item.template)
              p.onReset(item.id)
            }}
          >
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </button>
        )}
        <button className="pd-btn" disabled={!dirty} onClick={() => p.onSave(item.id, draft)}>
          <Save size={16} aria-hidden="true" /> Save
        </button>
        <button className="pd-btn" onClick={() => p.onToggleCombo(item.id)}>
          {p.inCombo ? <Check size={16} aria-hidden="true" /> : <Layers size={16} aria-hidden="true" />}
          {p.inCombo ? 'In combo' : 'Add to combo'}
        </button>
        <button className="pd-btn" onClick={() => copy.send(exportJson(), 'JSON copied')}>
          Copy JSON
        </button>
        <button className="pd-btn" onClick={() => copy.send(exportMarkdown(), 'Markdown copied')}>
          Copy Markdown
        </button>
        <button className="pd-btn pd-btn-primary" onClick={() => copy.send(output, 'Prompt copied')}>
          <Copy size={16} aria-hidden="true" /> Copy prompt
        </button>
      </footer>
    </ModalShell>
  )
}

/* ---------- Views ---------- */

function CategoryCard({
  cat,
  saved,
  onOpen,
}: {
  cat: Category
  saved: Record<string, string>
  onOpen: (id: string) => void
}) {
  const Icon = ICONS[cat.icon] ?? FileText
  return (
    <li className="pd-card">
      <div className="pd-card-head">
        <span className="pd-tile">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div>
          <h2>{cat.title}</h2>
          <p className="pd-blurb">{cat.blurb}</p>
        </div>
      </div>
      <ul className="pd-actions">
        {cat.prompts.map((item) => (
          <li key={item.id}>
            <button className="pd-action" onClick={() => onOpen(item.id)}>
              <span>{item.label}</span>
              <span className="pd-end">
                {saved[item.id] !== undefined && (
                  <>
                    <span className="pd-dot" aria-hidden="true" />
                    <span className="pd-sr">(saved edit)</span>
                  </>
                )}
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </li>
  )
}

function Tips() {
  return (
    <section className="pd-tips" aria-labelledby="pd-tips-title">
      <h2 className="pd-tips-label" id="pd-tips-title">
        Quick tips
      </h2>
      <ul className="pd-tips-list">
        <li>
          <strong>Set it once</strong>
          <span>Pick the service and area in the bar at the top. Every prompt fills them in.</span>
        </li>
        <li>
          <strong>Combine prompts</strong>
          <span>
            Merge Quotations with AI Image Prompts to generate branded proposals. Add both to Combo and copy them as
            one.
          </span>
        </li>
        <li>
          <strong>Check the forecast first</strong>
          <span>Run Plan My Week before you confirm painting, waterproofing or paving in winter.</span>
        </li>
        <li>
          <strong>Confirm the bank details</strong>
          <span>
            Quotes and invoices leave the Capitec account number <em>blank</em> until you confirm it.
          </span>
        </li>
      </ul>
    </section>
  )
}

/* ---------- Dashboard ---------- */

interface Ctx {
  service: string
  area: string
  header: boolean
}

export default function PromptDashboard() {
  const [view, setView] = useState<View>('dashboard')
  const [service, setService] = useState<string>(SERVICES[0])
  const [area, setArea] = useState<string>(AREAS[3])
  const [ctxHeader, setCtxHeader] = useState(true)
  const [vars, setVars] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [combo, setCombo] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const listCopy = useCopy()

  // Read browser storage after mount so the first render matches the server.
  useEffect(() => {
    const ctx = load<Ctx>(KEY_CTX, { service: SERVICES[0], area: AREAS[3], header: true })
    if ((SERVICES as readonly string[]).includes(ctx.service)) setService(ctx.service)
    if ((AREAS as readonly string[]).includes(ctx.area)) setArea(ctx.area)
    setCtxHeader(ctx.header !== false)
    setSaved(load<Record<string, string>>(KEY_SAVED, {}))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) store(KEY_CTX, { service, area, header: ctxHeader })
  }, [hydrated, service, area, ctxHeader])

  useEffect(() => {
    if (hydrated) store(KEY_SAVED, saved)
  }, [hydrated, saved])

  const values = useMemo(() => ({ ...vars, service, area }), [vars, service, area])

  const setValue = useCallback((name: string, value: string) => {
    if (name === 'service') setService(value)
    else if (name === 'area') setArea(value)
    else setVars((prev) => ({ ...prev, [name]: value }))
  }, [])

  const templateFor = (id: string) => saved[id] ?? INDEX.get(id)!.item.template

  const save = useCallback((id: string, template: string) => {
    setSaved((prev) => {
      const next = { ...prev }
      if (template === INDEX.get(id)!.item.template) delete next[id]
      else next[id] = template
      return next
    })
  }, [])

  const reset = useCallback((id: string) => {
    setSaved((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const toggleCombo = useCallback((id: string) => {
    setCombo((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const closeModal = useCallback(() => setOpenId(null), [])

  const savedIds = Object.keys(saved).filter((id) => INDEX.has(id))

  const comboNames = useMemo(() => {
    const seen: string[] = []
    combo.forEach((id) => {
      const tpl = saved[id] ?? INDEX.get(id)!.item.template
      extractVars(tpl).forEach((n) => {
        if (!seen.includes(n)) seen.push(n)
      })
    })
    return seen
  }, [combo, saved])

  const comboText = () => {
    const parts = combo.map((id, i) => {
      const { cat, item } = INDEX.get(id)!
      return `### Task ${i + 1}: ${cat.title}, ${item.label}\n${fillTemplate(templateFor(id), values)}`
    })
    return [
      ctxHeader ? CONTEXT_HEADER : '',
      'Complete every task below, then merge the results into one branded deliverable for the client without repeating shared details.',
      ...parts,
    ]
      .filter(Boolean)
      .join('\n\n')
  }

  const switchView = (v: View) => {
    listCopy.clear()
    setView(v)
  }

  return (
    <div className="pd-root">
      <header className="pd-top">
        <div>
          <Link href="/admin" className="pd-back">
            <ArrowLeft size={14} aria-hidden="true" /> Admin dashboard
          </Link>
          <h1 className="pd-title">Prompt Dashboard</h1>
          <p className="pd-sub">
            Ready-made prompts for quotes, marketing, scheduling and running NGMS. One Call. All Solutions.
          </p>
        </div>
        <nav className="pd-nav" aria-label="Views">
          <button aria-current={view === 'dashboard' ? 'page' : undefined} onClick={() => switchView('dashboard')}>
            Dashboard
          </button>
          <button aria-current={view === 'saved' ? 'page' : undefined} onClick={() => switchView('saved')}>
            Saved {savedIds.length > 0 && <span className="pd-count">{savedIds.length}</span>}
          </button>
          <button aria-current={view === 'combo' ? 'page' : undefined} onClick={() => switchView('combo')}>
            Combo {combo.length > 0 && <span className="pd-count">{combo.length}</span>}
          </button>
        </nav>
      </header>

      <div className="pd-ctx" role="group" aria-label="Working context">
        <span className="pd-ctx-lead">Working on</span>
        <SelectBox id="pd-ctx-service" label="Service" value={service} options={SERVICES} onChange={setService} />
        <SelectBox id="pd-ctx-area" label="Area" value={area} options={AREAS} onChange={setArea} />
        <div className="pd-ctx-tail">
          <label className="pd-check" htmlFor="pd-ctx-header">
            <input
              id="pd-ctx-header"
              type="checkbox"
              checked={ctxHeader}
              onChange={(e) => setCtxHeader(e.target.checked)}
            />
            Add NGMS context line
          </label>
          <span className="pd-stat">
            {CATEGORIES.length} categories · {TOTAL_PROMPTS} prompts
          </span>
        </div>
      </div>

      {view === 'dashboard' && (
        <>
          <ul className="pd-grid" aria-label="Prompt categories">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} saved={saved} onOpen={setOpenId} />
            ))}
          </ul>
          <Tips />
        </>
      )}

      {view === 'saved' && (
        <section className="pd-panel" aria-labelledby="pd-saved-title">
          <div className="pd-panel-head">
            <div>
              <h2 id="pd-saved-title">Saved prompts</h2>
              <p>
                Your edited versions. They stay on this device and replace the default wherever the prompt appears.
              </p>
            </div>
            {savedIds.length > 0 && (
              <div className="pd-row-actions">
                <button
                  className="pd-btn"
                  onClick={() =>
                    listCopy.send(
                      JSON.stringify(
                        savedIds.map((id) => ({
                          id,
                          category: INDEX.get(id)!.cat.title,
                          prompt: INDEX.get(id)!.item.label,
                          template: saved[id],
                        })),
                        null,
                        2,
                      ),
                      'All saved prompts copied as JSON',
                    )
                  }
                >
                  <Copy size={16} aria-hidden="true" /> Copy all as JSON
                </button>
              </div>
            )}
          </div>
          <CopyNotice copy={listCopy} variant="panel" />
          {savedIds.length === 0 ? (
            <div className="pd-empty">
              <p>
                Nothing saved yet. Open any prompt from the Dashboard, change the wording, and press Save. Your
                version is kept on this device.
              </p>
              <button className="pd-btn" onClick={() => switchView('dashboard')}>
                Back to the dashboard
              </button>
            </div>
          ) : (
            <ul className="pd-list">
              {savedIds.map((id) => {
                const { cat, item } = INDEX.get(id)!
                return (
                  <li className="pd-item" key={id}>
                    <div className="pd-item-main">
                      <p className="pd-eyebrow">{cat.title}</p>
                      <h3>{item.label}</h3>
                      <p className="pd-snippet">{saved[id]}</p>
                    </div>
                    <div className="pd-row-actions">
                      <button className="pd-btn" onClick={() => setOpenId(id)}>
                        Open
                      </button>
                      <button
                        className="pd-btn pd-btn-quiet"
                        onClick={() => reset(id)}
                        aria-label={`Remove saved ${item.label}`}
                      >
                        <Trash2 size={16} aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {view === 'combo' && (
        <section className="pd-panel" aria-labelledby="pd-combo-title">
          <div className="pd-panel-head">
            <div>
              <h2 id="pd-combo-title">Combo</h2>
              <p>
                Stack prompts from different categories and copy them as one request, for example a quote plus a
                branded image for the proposal cover.
              </p>
            </div>
            {combo.length > 0 && (
              <div className="pd-row-actions">
                <button className="pd-btn pd-btn-quiet" onClick={() => setCombo([])}>
                  Clear
                </button>
                <button
                  className="pd-btn pd-btn-primary"
                  onClick={() => listCopy.send(comboText(), 'Combined prompt copied')}
                >
                  <Copy size={16} aria-hidden="true" /> Copy combined prompt
                </button>
              </div>
            )}
          </div>
          <CopyNotice copy={listCopy} variant="panel" />
          {combo.length === 0 ? (
            <div className="pd-empty">
              <p>
                Your combo is empty. Add prompts from inside any prompt window, or start with the example: a branded
                quote plus a hero image for the proposal cover.
              </p>
              <button className="pd-btn" onClick={() => setCombo(['quotations.1', 'images.1'])}>
                <Plus size={16} aria-hidden="true" /> Add example combo
              </button>
            </div>
          ) : (
            <>
              <ul className="pd-list">
                {combo.map((id) => {
                  const { cat, item } = INDEX.get(id)!
                  return (
                    <li className="pd-item" key={id}>
                      <div className="pd-item-main">
                        <p className="pd-eyebrow">{cat.title}</p>
                        <h3>{item.label}</h3>
                      </div>
                      <div className="pd-row-actions">
                        <button className="pd-btn" onClick={() => setOpenId(id)}>
                          Open
                        </button>
                        <button
                          className="pd-btn pd-btn-quiet"
                          onClick={() => toggleCombo(id)}
                          aria-label={`Remove ${item.label} from combo`}
                        >
                          <X size={16} aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="pd-combo-fields">
                <h3 className="pd-mini">Shared details</h3>
                <Fields names={comboNames} values={values} onChange={setValue} prefix="pd-c" />
              </div>
            </>
          )}
        </section>
      )}

      {openId && INDEX.has(openId) && (
        <PromptModal
          key={openId}
          id={openId}
          values={values}
          onValue={setValue}
          ctxHeader={ctxHeader}
          onCtxHeader={setCtxHeader}
          savedTemplate={saved[openId]}
          onSave={save}
          onReset={reset}
          inCombo={combo.includes(openId)}
          onToggleCombo={toggleCombo}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
