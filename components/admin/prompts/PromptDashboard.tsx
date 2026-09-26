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
  Database,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  Megaphone,
  MessageCircle,
  PhoneCall,
  Plus,
  Receipt,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  Wrench,
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
import { GENERATORS, GENERATORS_CHECKED } from '@/lib/image-generators'
import { supabase } from '@/lib/supabaseClient'
import './prompt-dashboard.css'

/* ---------- Static lookups ---------- */

const ICONS: Record<string, LucideIcon> = {
  Layers,
  Sparkles,
  Wrench,
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
const BUILTIN_COUNT = INDEX.size

/* ---------- Admin library (Supabase `prompts` table) ---------- */

// Prompts saved in the database are merged into INDEX with ids `db.<uuid>`, so the same modal,
// combo and search work for both sources. Saving a db prompt writes back to Supabase (shared on
// every device); built-in prompts keep their per-device saved edits.

const DB_ICON: Record<string, string> = {
  quotations: 'FileText',
  marketing: 'Megaphone',
  'solar-services': 'Sparkles',
  painting: 'Layers',
  plumbing: 'Wrench',
  electrical: 'Target',
  paving: 'Layers',
  'property-maintenance': 'Building2',
  'customer-communication': 'MessageCircle',
  'ai-image-prompts': 'Image',
  administration: 'CalendarDays',
  'business-growth': 'Target',
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const isDb = (id: string) => id.startsWith('db.')
const dbUuid = (id: string) => id.slice(3)
const isImageCat = (cat: Category) => cat.id === 'images' || cat.id === 'db-ai-image-prompts'

interface DbRow {
  id: string
  title: string
  description: string | null
  prompt_template: string
  category_id: string | null
  prompt_categories: { name: string; sort_order: number | null } | null
}

async function loadDbCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('id,title,description,prompt_template,category_id,prompt_categories(name,sort_order)')
    .eq('active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  const groups = new Map<string, { cat: Category; order: number }>()
  ;((data ?? []) as unknown as DbRow[]).forEach((r) => {
    const name = r.prompt_categories?.name ?? 'General'
    const id = `db-${slug(name)}`
    if (!groups.has(id)) {
      groups.set(id, {
        order: r.prompt_categories?.sort_order ?? 999,
        cat: {
          id,
          title: name,
          blurb: 'Admin library',
          icon: DB_ICON[slug(name)] ?? 'FileText',
          accent: 'orange',
          prompts: [],
        },
      })
    }
    groups.get(id)!.cat.prompts.push({ id: `db.${r.id}`, label: r.title, template: r.prompt_template })
  })
  const cats = Array.from(groups.values())
    .sort((a, b) => a.order - b.order)
    .map((g) => g.cat)
  cats.forEach((cat) => cat.prompts.forEach((item) => INDEX.set(item.id, { cat, item })))
  return cats
}

async function logUse(id: string, action: string, values: Record<string, string>) {
  if (!isDb(id)) return
  try {
    const { data } = await supabase.auth.getUser()
    const uid = data.user?.id
    if (!uid) return
    await supabase.from('prompt_activity_logs').insert({
      user_id: uid,
      prompt_id: dbUuid(id),
      action,
      input_data: values,
    })
  } catch {
    /* logging is best-effort */
  }
}

const CLAUDE_URL = 'https://claude.ai/new?q='
// Long prompts can exceed what a URL carries; past this we copy and open a blank chat instead.
const CLAUDE_URL_MAX = 6000

type View = 'dashboard' | 'library' | 'saved' | 'combo'

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

/* ---------- Free AI image generators ---------- */

// Inside an image prompt: each button copies the finished prompt, then opens the generator in a
// new tab. The copy starts inside the click, so the browser allows it before the new tab takes focus.
function GeneratorStrip({ onCopy }: { onCopy: (generatorName: string) => void }) {
  return (
    <div className="pd-strip" role="group" aria-label="Copy the prompt and open a free image generator">
      <p className="pd-strip-label">Copy prompt and open a free generator</p>
      <div className="pd-strip-links">
        {GENERATORS.map((g) => (
          <a
            key={g.id}
            className="pd-chip"
            href={g.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onCopy(g.name)}
          >
            {g.short}
            <ExternalLink size={13} aria-hidden="true" />
            <span className="pd-sr">(copies the prompt, opens in a new tab)</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function GeneratorPanel() {
  return (
    <section className="pd-panel pd-gens" aria-labelledby="pd-gens-title">
      <div className="pd-panel-head">
        <div>
          <h2 id="pd-gens-title">Free AI image generators</h2>
          <p>
            Open an AI Image Prompt above, copy it, then paste it into one of these. Free plans change often. Last
            checked {GENERATORS_CHECKED}.
          </p>
        </div>
      </div>
      <ul className="pd-gen-grid">
        {GENERATORS.map((g) => (
          <li className="pd-gen" key={g.id}>
            <div className="pd-gen-top">
              <h3>{g.name}</h3>
              {g.noSignIn && <span className="pd-tag">No sign-in</span>}
            </div>
            <p className="pd-gen-best">{g.bestFor}</p>
            <p className="pd-gen-line">
              <span>Free plan</span>
              {g.free}
            </p>
            <p className="pd-gen-line">
              <span>Watch out</span>
              {g.watch}
            </p>
            <a className="pd-btn pd-gen-open" href={g.url} target="_blank" rel="noopener noreferrer">
              Open {g.name}
              <ExternalLink size={15} aria-hidden="true" />
              <span className="pd-sr">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="pd-note">
        AI tools cannot draw the real NGMS logo or your job photos properly. Generate the background or scene, then add
        the logo and your real before and after photos on top. Check a tool&apos;s licence before you use its image in
        paid ads.
      </p>
    </section>
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
  onUsed: (id: string, action: string) => void
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
          {isImageCat(cat) && (
            <GeneratorStrip onCopy={(name) => copy.send(output, `Prompt copied. Paste it into ${name}.`)} />
          )}
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
          <Save size={16} aria-hidden="true" /> {isDb(item.id) ? 'Save to library' : 'Save'}
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
        <button
          className="pd-btn pd-btn-primary"
          onClick={() => {
            copy.send(output, 'Prompt copied')
            p.onUsed(item.id, 'copy')
          }}
        >
          <Copy size={16} aria-hidden="true" /> Copy prompt
        </button>
        <a
          className="pd-btn pd-btn-primary"
          href={output.length <= CLAUDE_URL_MAX ? CLAUDE_URL + encodeURIComponent(output) : 'https://claude.ai/new'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            copy.send(
              output,
              output.length <= CLAUDE_URL_MAX
                ? 'Opening Claude with the prompt filled in (also copied).'
                : 'Prompt copied. Paste it into the new Claude chat.',
            )
            p.onUsed(item.id, 'open_claude')
          }}
        >
          <Sparkles size={16} aria-hidden="true" /> Open in Claude
          <span className="pd-sr">(opens in a new tab)</span>
        </a>
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
  const [dbCats, setDbCats] = useState<Category[]>([])
  const [dbState, setDbState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [dbMsg, setDbMsg] = useState<string | null>(null)
  const [, setDbVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [libCat, setLibCat] = useState<string>('all')
  const listCopy = useCopy()

  const reloadDb = useCallback(() => {
    setDbState('loading')
    loadDbCategories()
      .then((cats) => {
        setDbCats(cats)
        setDbState('ready')
      })
      .catch(() => setDbState('error'))
  }, [])

  useEffect(() => {
    reloadDb()
  }, [reloadDb])

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
    if (isDb(id)) {
      const ref = INDEX.get(id)
      if (!ref) return
      setDbMsg('Saving to the library…')
      supabase
        .from('prompts')
        .update({ prompt_template: template, updated_at: new Date().toISOString() })
        .eq('id', dbUuid(id))
        .select('id')
        .then(({ data, error }) => {
          if (error || !data || data.length === 0) {
            setDbMsg('Could not save to the library. Only prompt admins can change shared prompts.')
            return
          }
          ref.item.template = template
          setDbVersion((v) => v + 1)
          setDbMsg(`Saved “${ref.item.label}” to the library. It updates on every device.`)
        })
      return
    }
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

  const used = useCallback((id: string, action: string) => {
    logUse(id, action, { ...vars, service, area })
  }, [vars, service, area])

  const dbCount = dbCats.reduce((n, c) => n + c.prompts.length, 0)
  const allCats = useMemo(() => [...dbCats, ...CATEGORIES], [dbCats])

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const out: { cat: Category; item: PromptItem; source: 'library' | 'built-in' }[] = []
    allCats.forEach((cat) => {
      if (libCat === 'library' && !cat.id.startsWith('db-')) return
      if (libCat === 'built-in' && cat.id.startsWith('db-')) return
      if (libCat !== 'all' && libCat !== 'library' && libCat !== 'built-in' && cat.title !== libCat) return
      cat.prompts.forEach((item) => {
        const tpl = saved[item.id] ?? item.template
        const hay = `${cat.title} ${item.label} ${tpl}`.toLowerCase()
        if (words.every((w) => hay.includes(w))) {
          out.push({ cat, item, source: cat.id.startsWith('db-') ? 'library' : 'built-in' })
        }
      })
    })
    return out
  }, [allCats, query, libCat, saved])

  const catTitles = useMemo(() => Array.from(new Set(allCats.map((c) => c.title))), [allCats])

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
          <button aria-current={view === 'library' ? 'page' : undefined} onClick={() => switchView('library')}>
            <Search size={14} aria-hidden="true" /> Search
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
            {BUILTIN_COUNT} built-in · {dbState === 'ready' ? dbCount : '…'} in library
          </span>
        </div>
      </div>

      {dbMsg && (
        <p className="pd-notice pd-db-msg" data-kind={dbMsg.startsWith('Could not') ? 'warn' : 'ok'} role="status">
          {dbMsg}
          <button className="pd-icon-btn" onClick={() => setDbMsg(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </p>
      )}

      {view === 'dashboard' && (
        <>
          <form
            className="pd-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              switchView('library')
            }}
          >
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all prompts: quote, solar, WhatsApp, paving…"
              aria-label="Search all prompts"
            />
            <button className="pd-btn" type="submit">
              Search
            </button>
          </form>

          <section className="pd-panel" aria-labelledby="pd-lib-title">
            <div className="pd-panel-head">
              <div>
                <h2 id="pd-lib-title">
                  <Database size={18} aria-hidden="true" /> Admin library
                </h2>
                <p>Shared prompts saved in the database. Edits you save here update on every device.</p>
              </div>
              {dbState === 'error' && (
                <button className="pd-btn" onClick={reloadDb}>
                  <RotateCcw size={16} aria-hidden="true" /> Retry
                </button>
              )}
            </div>
            {dbState === 'loading' && (
              <p className="pd-db-state">
                <Loader2 size={16} className="pd-spin" aria-hidden="true" /> Loading library…
              </p>
            )}
            {dbState === 'error' && (
              <p className="pd-db-state">
                Couldn&apos;t load the library. Check you&apos;re signed in with a prompt-user account, then retry.
              </p>
            )}
            {dbState === 'ready' && dbCats.length === 0 && (
              <p className="pd-db-state">No active prompts in the library yet.</p>
            )}
            {dbState === 'ready' && dbCats.length > 0 && (
              <ul className="pd-grid" aria-label="Admin library categories">
                {dbCats.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} saved={saved} onOpen={setOpenId} />
                ))}
              </ul>
            )}
          </section>

          <h2 className="pd-section-label">Built-in prompts</h2>
          <ul className="pd-grid" aria-label="Prompt categories">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} saved={saved} onOpen={setOpenId} />
            ))}
          </ul>
          <GeneratorPanel />
          <Tips />
        </>
      )}

      {view === 'library' && (
        <section className="pd-panel" aria-labelledby="pd-search-title">
          <div className="pd-panel-head">
            <div>
              <h2 id="pd-search-title">Search prompts</h2>
              <p>Searches titles and full prompt text across the admin library and the built-in set.</p>
            </div>
          </div>
          <div className="pd-search" role="search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. solar quote, whatsapp, body corporate"
              aria-label="Search prompts"
              autoFocus
            />
          </div>
          <div className="pd-filter" role="group" aria-label="Filter by source or category">
            {['all', 'library', 'built-in', ...catTitles].map((c) => (
              <button
                key={c}
                className="pd-chip"
                aria-pressed={libCat === c}
                onClick={() => setLibCat(c)}
              >
                {c === 'all' ? 'All' : c === 'library' ? 'Admin library' : c === 'built-in' ? 'Built-in' : c}
              </button>
            ))}
          </div>
          <p className="pd-stat" aria-live="polite">
            {results.length} prompt{results.length === 1 ? '' : 's'}
            {dbState === 'loading' ? ' (library still loading)' : ''}
          </p>
          {results.length === 0 ? (
            <div className="pd-empty">
              <p>No prompts match. Try one word, like “quote” or “solar”, or switch the filter to All.</p>
            </div>
          ) : (
            <ul className="pd-list">
              {results.map(({ cat, item, source }) => (
                <li className="pd-item" key={item.id}>
                  <div className="pd-item-main">
                    <p className="pd-eyebrow">
                      {cat.title} · {source === 'library' ? 'Admin library' : 'Built-in'}
                    </p>
                    <h3>{item.label}</h3>
                    <p className="pd-snippet">{saved[item.id] ?? item.template}</p>
                  </div>
                  <div className="pd-row-actions">
                    <button className="pd-btn pd-btn-primary" onClick={() => setOpenId(item.id)}>
                      Open
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
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
          onUsed={used}
        />
      )}
    </div>
  )
}
