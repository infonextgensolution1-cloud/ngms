import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * NGSMS Ops MCP server — quotes, invoices, jobs & job costing
 * -----------------------------------------------------------
 * Lets Claude (or any MCP client) run the money side of NGSMS in the admin
 * Supabase project (dfwwpqtsbaytfqptancj): clients, quotes, invoices,
 * payments, jobs, labour/material/fuel/overhead costs and profit per job.
 * Works alongside the NGSMS Leads connector (app/api/mcp/[key]) — quotes can
 * be raised straight from a lead, and the lead is moved to "quoted"/"won"/"lost".
 *
 * Connector URL (Claude → Settings → Connectors → Add custom connector):
 *   https://www.nextgensolarmaintenance.co.za/api/mcp-ops/<MCP_ACCESS_KEY>
 *
 * Uses the SAME Vercel env vars as the Leads connector — nothing new to add:
 *   MCP_ACCESS_KEY             (or set MCP_OPS_ACCESS_KEY to give this one its own key)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Money rules baked in (from NGSMS defaults):
 *   - Prices are entered in Rand EXCLUDING VAT.
 *   - VAT is only added if settings.vat_number is a real VAT number. While it
 *     says "NOT REGISTERED", VAT can't be charged (VAT Act) and the tools refuse.
 *   - Default deposit 70% / balance 30% on completion.
 *   - Quote validity = settings.quote_expiry_days (30).
 *   - Numbering: Q-0001, INV-0001.
 *
 * Transport: MCP Streamable HTTP, stateless, plain JSON responses.
 */


export const SERVER_INFO = { name: 'ngsms-ops', title: 'NGSMS Ops', version: '1.0.0' }
export const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired'] as const
export const INVOICE_STATUSES = ['draft', 'sent', 'partial', 'paid', 'void'] as const
export const JOB_STATUSES = ['scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled'] as const
export const COST_CATEGORIES = ['Materials', 'Fuel', 'Overhead', 'Subcontractor', 'Labour'] as const
export const INVOICE_KINDS = ['full', 'deposit', 'balance'] as const
export const PAY_METHODS = ['eft', 'cash', 'card', 'other'] as const

export const DEFAULT_DEPOSIT_PERCENT = 70
export const DEFAULT_DUE_DAYS = 7
export const OVERBERG = /kleinmond|grabouw|elgin|bot ?rivi|botrivier|hermanus|betty'?s bay|pringle|rooi[- ]?els|caledon|villiersdorp|onrus|sandbaai/i
export const WET_WEATHER_TRADES = /paint|waterproof|torch|membrane|paving|pave|sealant|roof coat/i

export const CLIENT_COLS = 'id,name,email,phone,address,suburb,notes,created_at'
export const QUOTE_COLS = 'id,quote_number,client_id,lead_id,status,vat_included,deposit_amount,total_amount,notes,valid_until,created_at,updated_at'
export const INVOICE_COLS = 'id,invoice_number,quote_id,client_id,status,total_amount,paid_amount,due_date,notes,created_at'
export const JOB_COLS = 'id,client_id,quote_id,title,description,status,scheduled_date,completed_date,created_at'
export const ITEM_COLS = 'id,description,quantity,unit,unit_price'

export type Client = { id: string; name: string; email: string | null; phone: string | null; address: string | null; suburb: string | null; notes: string | null; created_at: string }
export type Quote = { id: string; quote_number: string; client_id: string | null; lead_id: string | null; status: string; vat_included: boolean | null; deposit_amount: number | null; total_amount: number | null; notes: string | null; valid_until: string | null; created_at: string; updated_at: string }
export type Invoice = { id: string; invoice_number: string; quote_id: string | null; client_id: string | null; status: string; total_amount: number | null; paid_amount: number | null; due_date: string | null; notes: string | null; created_at: string }
export type Job = { id: string; client_id: string | null; quote_id: string | null; title: string | null; description: string | null; status: string; scheduled_date: string | null; completed_date: string | null; created_at: string }
export type Item = { id?: string; description: string; quantity: number; unit: string; unit_price: number; service_id?: string | null }
export type NewItem = Item & { service_slug?: string }
export type Settings = { business_name: string | null; vat_number: string | null; vat_rate: number; vat_registered: boolean; quote_expiry_days: number; phone: string | null; email: string | null; whatsapp: string | null; address: string | null; bank_details: string | null; logo_url: string | null }

export type Args = Record<string, unknown>
export type ToolResult = { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean }

// ================================================================ helpers

export class ToolError extends Error {}

export function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dfwwpqtsbaytfqptancj.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new ToolError('Server not configured: SUPABASE_SERVICE_ROLE_KEY is missing in Vercel env vars. Add it, then redeploy.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function fail(what: string, error: { message: string } | null): asserts error is null {
  if (error) throw new ToolError(`${what}: ${error.message}`)
}

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export const n0 = (v: unknown) => (v === null || v === undefined ? 0 : Number(v))

export function rand(n: number): string {
  const neg = n < 0
  const [whole, cents] = Math.abs(r2(n)).toFixed(2).split('.')
  return `${neg ? '-' : ''}R${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${cents}`
}

export function todaySast(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
}
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
export function sast(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

export function str(args: Args, key: string, opts: { required?: boolean; max?: number } = {}): string | undefined {
  const v = args[key]
  if (v === undefined || v === null || v === '') {
    if (opts.required) throw new ToolError(`'${key}' is required.`)
    return undefined
  }
  if (typeof v !== 'string') throw new ToolError(`'${key}' must be a string.`)
  const t = v.trim()
  if (opts.max && t.length > opts.max) throw new ToolError(`'${key}' must be at most ${opts.max} characters.`)
  if (opts.required && !t) throw new ToolError(`'${key}' is required.`)
  return t || undefined
}

export function num(args: Args, key: string, opts: { min?: number; max?: number; required?: boolean; integer?: boolean } = {}): number | undefined {
  const v = args[key]
  if (v === undefined || v === null || v === '') {
    if (opts.required) throw new ToolError(`'${key}' is required.`)
    return undefined
  }
  const n = typeof v === 'string' ? Number(v.replace(/[R\s,]/g, '')) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new ToolError(`'${key}' must be a number.`)
  if (opts.integer && !Number.isInteger(n)) throw new ToolError(`'${key}' must be a whole number.`)
  if (opts.min !== undefined && n < opts.min) throw new ToolError(`'${key}' must be at least ${opts.min}.`)
  if (opts.max !== undefined && n > opts.max) throw new ToolError(`'${key}' must be at most ${opts.max}.`)
  return n
}

export function int(args: Args, key: string, def: number, min: number, max: number): number {
  return num(args, key, { min, max, integer: true }) ?? def
}

export function bool(args: Args, key: string): boolean | undefined {
  const v = args[key]
  if (v === undefined || v === null) return undefined
  if (typeof v !== 'boolean') throw new ToolError(`'${key}' must be true or false.`)
  return v
}

export function oneOf<T extends readonly string[]>(args: Args, key: string, allowed: T): T[number] | undefined {
  const v = str(args, key)
  if (v === undefined) return undefined
  if (!(allowed as readonly string[]).includes(v)) throw new ToolError(`'${key}' must be one of: ${allowed.join(', ')}. Got '${v}'.`)
  return v as T[number]
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function uuid(args: Args, key: string, hint: string, required = true): string | undefined {
  const v = str(args, key, { required })
  if (v === undefined) return undefined
  if (!UUID_RE.test(v)) throw new ToolError(`'${key}' must be a UUID (${hint}).`)
  return v
}

export function date(args: Args, key: string): string | undefined {
  const v = str(args, key)
  if (v === undefined) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new ToolError(`'${key}' must be a date like 2026-10-05.`)
  return v
}

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  if (/^0\d{9}$/.test(digits)) return '+27' + digits.slice(1)
  if (/^27\d{9}$/.test(digits)) return '+' + digits
  return digits || raw
}
export const phoneTail = (p: string) => p.replace(/\D/g, '').slice(-9)
export const clean = (s: string) => s.replace(/[%_,()*]/g, ' ').trim()

export function ok(text: string, structured?: Record<string, unknown>): ToolResult {
  return { content: [{ type: 'text', text }], ...(structured ? { structuredContent: structured } : {}) }
}

// ---------------------------------------------------------------- settings

export async function getSettings(sb: SupabaseClient): Promise<Settings> {
  const { data, error } = await sb.from('settings').select('*').eq('id', 1).maybeSingle()
  fail('Could not load settings', error)
  const s = (data ?? {}) as Record<string, unknown>
  const vatNumber = (s.vat_number as string | null) ?? null
  return {
    business_name: (s.business_name as string) ?? 'NextGen Solar Clean & Maintenance Solutions',
    vat_number: vatNumber,
    vat_rate: n0(s.vat_rate) || 15,
    vat_registered: !!vatNumber && /\d{6,}/.test(vatNumber) && !/not\s*reg/i.test(vatNumber),
    quote_expiry_days: n0(s.quote_expiry_days) || 30,
    phone: (s.phone as string) ?? null,
    email: (s.email as string) ?? null,
    whatsapp: (s.whatsapp as string) ?? null,
    address: (s.address as string) ?? null,
    bank_details: (s.bank_details as string) ?? null,
    logo_url: (s.logo_url as string) ?? null,
  }
}

export function resolveVat(requested: boolean | undefined, s: Settings): boolean {
  const vat = requested ?? s.vat_registered
  if (vat && !s.vat_registered) {
    throw new ToolError(
      `Can't add VAT: settings show VAT number '${s.vat_number ?? 'none'}'. A business that isn't VAT-registered may not charge VAT. ` +
        'Leave apply_vat off (prices are VAT-exclusive), or update the VAT number in settings once registered.'
    )
  }
  return vat
}

// ---------------------------------------------------------------- numbering

export async function nextNumber(sb: SupabaseClient, table: 'quotes' | 'invoices', col: string, prefix: string): Promise<string> {
  const { data, error } = await sb.from(table).select(col).like(col, `${prefix}-%`).limit(10000)
  fail(`Could not read ${table} numbers`, error)
  const max = ((data ?? []) as unknown as Record<string, string>[]).reduce((m, row) => {
    const n = Number(String(row[col]).slice(prefix.length + 1))
    return Number.isInteger(n) && n > m ? n : m
  }, 0)
  return `${prefix}-${String(max + 1).padStart(4, '0')}`
}

/** Insert a row that needs the next Q-/INV- number, retrying if two inserts race for the same number. */
export async function insertNumbered<T>(sb: SupabaseClient, table: 'quotes' | 'invoices', col: string, prefix: string, row: Record<string, unknown>, cols: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const number = await nextNumber(sb, table, col, prefix)
    const { data, error } = await sb.from(table).insert({ ...row, [col]: number }).select(cols).single()
    if (!error) return data as T
    if ((error as { code?: string }).code !== '23505') throw new ToolError(`Could not create ${table.slice(0, -1)}: ${error.message}`)
  }
  throw new ToolError(`Could not allocate a ${prefix} number — please retry.`)
}

// ---------------------------------------------------------------- items & totals

export async function serviceMap(sb: SupabaseClient): Promise<Map<string, { id: string; name: string }>> {
  const { data, error } = await sb.from('services').select('id,slug,name')
  fail('Could not load services', error)
  return new Map(((data ?? []) as { id: string; slug: string; name: string }[]).map((s) => [s.slug, { id: s.id, name: s.name }]))
}

export function parseItems(args: Args, key = 'items'): NewItem[] {
  const raw = args[key]
  if (!Array.isArray(raw) || raw.length === 0) throw new ToolError(`'${key}' must be a list with at least one line item.`)
  if (raw.length > 100) throw new ToolError(`'${key}' can have at most 100 lines.`)
  return raw.map((r, i) => {
    if (typeof r !== 'object' || r === null || Array.isArray(r)) throw new ToolError(`${key}[${i}] must be an object.`)
    const a = r as Args
    const label = `${key}[${i}]`
    try {
      return {
        description: str(a, 'description', { required: true, max: 500 })!,
        quantity: num(a, 'quantity', { min: 0.001, max: 1_000_000 }) ?? 1,
        unit: str(a, 'unit', { max: 20 }) ?? 'item',
        unit_price: r2(num(a, 'unit_price', { required: true, min: -10_000_000, max: 10_000_000 })!),
        service_slug: str(a, 'service_slug', { max: 60 }),
      }
    } catch (e) {
      throw new ToolError(`${label}: ${(e as Error).message}`)
    }
  })
}

export async function attachServices(sb: SupabaseClient, items: NewItem[]): Promise<void> {
  if (!items.some((i) => i.service_slug)) return
  const map = await serviceMap(sb)
  for (const it of items) {
    if (!it.service_slug) continue
    const hit = map.get(it.service_slug)
    if (!hit) throw new ToolError(`Unknown service_slug '${it.service_slug}'. Valid: ${[...map.keys()].sort().join(', ')}`)
    it.service_id = hit.id
  }
}

export function totals(items: Pick<Item, 'quantity' | 'unit_price'>[], vat: boolean, rate: number) {
  const subtotal = r2(items.reduce((s, i) => s + r2(n0(i.quantity) * n0(i.unit_price)), 0))
  const vatAmount = vat ? r2((subtotal * rate) / 100) : 0
  return { subtotal, vat: vatAmount, total: r2(subtotal + vatAmount) }
}

export function itemTable(items: Item[]): string {
  if (!items.length) return '_(no line items)_'
  const rows = items.map((it, i) => `| ${i + 1} | ${it.description.replace(/\|/g, '/')} | ${n0(it.quantity)} | ${it.unit ?? ''} | ${rand(n0(it.unit_price))} | ${rand(n0(it.quantity) * n0(it.unit_price))} |`)
  return ['| # | Description | Qty | Unit | Unit price | Amount |', '|---|---|---|---|---|---|', ...rows].join('\n')
}

export function pctOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

// ---------------------------------------------------------------- clients & leads

export async function fetchClient(sb: SupabaseClient, id: string): Promise<Client> {
  const { data, error } = await sb.from('clients').select(CLIENT_COLS).eq('id', id).maybeSingle()
  fail('Database error', error)
  if (!data) throw new ToolError(`No client with id ${id}. Use ngms_list_clients to find it.`)
  return data as Client
}

export async function findClientByPhone(sb: SupabaseClient, phone: string): Promise<Client | null> {
  const tail = phoneTail(phone)
  if (tail.length < 9) return null
  const { data } = await sb.from('clients').select(CLIENT_COLS).ilike('phone', `%${tail}`).limit(1)
  return ((data ?? [])[0] as Client) ?? null
}

export type ClientResolution = { client: Client; note: string | null; leadId: string | null }

/** client_id  |  lead_id (reuses/creates a client from the lead)  |  client { name, phone, ... } */
export async function resolveClient(sb: SupabaseClient, args: Args): Promise<ClientResolution> {
  const clientId = uuid(args, 'client_id', 'from ngms_list_clients', false)
  const leadId = uuid(args, 'lead_id', 'from the NGSMS Leads connector', false) ?? null
  if (clientId) return { client: await fetchClient(sb, clientId), note: null, leadId }

  if (leadId) {
    const { data: lead, error } = await sb.from('leads').select('id,name,phone,email,suburb,message').eq('id', leadId).maybeSingle()
    fail('Could not load lead', error)
    if (!lead) throw new ToolError(`No lead with id ${leadId}.`)
    const existing = await findClientByPhone(sb, lead.phone)
    if (existing) return { client: existing, note: `Using existing client **${existing.name}** (same phone as the lead).`, leadId }
    const { data, error: e2 } = await sb
      .from('clients')
      .insert({ name: lead.name, phone: normalisePhone(lead.phone), email: lead.email, suburb: lead.suburb, notes: `Created from lead ${lead.id}` })
      .select(CLIENT_COLS)
      .single()
    fail('Could not create client from lead', e2)
    return { client: data as Client, note: `New client **${lead.name}** created from the lead.`, leadId }
  }

  const c = args.client
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    const ca = c as Args
    const name = str(ca, 'name', { required: true, max: 120 })!
    const phoneRaw = str(ca, 'phone', { max: 30 })
    const phone = phoneRaw ? normalisePhone(phoneRaw) : null
    if (phone) {
      const existing = await findClientByPhone(sb, phone)
      if (existing) return { client: existing, note: `Phone matches existing client **${existing.name}** — used that record instead of creating a duplicate.`, leadId }
    }
    const email = str(ca, 'email', { max: 160 })
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ToolError(`'${email}' is not a valid email.`)
    const { data, error } = await sb
      .from('clients')
      .insert({ name, phone, email: email ?? null, address: str(ca, 'address', { max: 300 }) ?? null, suburb: str(ca, 'suburb', { max: 80 }) ?? null })
      .select(CLIENT_COLS)
      .single()
    fail('Could not create client', error)
    return { client: data as Client, note: `New client **${name}** created.`, leadId }
  }
  throw new ToolError("Say who it's for: give client_id, lead_id, or client { name, phone, suburb, … }.")
}

export const LEAD_ORDER = ['new', 'contacted', 'site_visit', 'quoted', 'won', 'lost']

/** Append a timestamped note to a lead (same format as the Leads connector) and optionally move its stage. */
export async function touchLead(sb: SupabaseClient, leadId: string | null, to: 'quoted' | 'won' | 'lost' | null, note: string): Promise<string | null> {
  if (!leadId) return null
  const { data: lead } = await sb.from('leads').select('id,status,notes').eq('id', leadId).maybeSingle()
  if (!lead) return null
  const now = new Date().toISOString()
  let move: string | null = null
  if (to === 'quoted' && LEAD_ORDER.indexOf(lead.status) < LEAD_ORDER.indexOf('quoted')) move = 'quoted'
  if ((to === 'won' || to === 'lost') && lead.status !== to) move = to
  const entry = `[${sast(now)}]${move ? ` (${lead.status} → ${move})` : ''} ${note}`.trim()
  const patch: Record<string, unknown> = { notes: lead.notes ? `${lead.notes}\n${entry}` : entry, updated_at: now }
  if (move) patch.status = move
  const { error } = await sb.from('leads').update(patch).eq('id', leadId)
  if (error) return `(Couldn't update the lead: ${error.message})`
  return move ? `Lead moved ${lead.status} → ${move}.` : 'Note added to the lead.'
}

// ---------------------------------------------------------------- loaders & formatting

export async function loadQuote(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from('quotes').select(`${QUOTE_COLS}, clients(${CLIENT_COLS})`).eq('id', id).maybeSingle()
  fail('Database error', error)
  if (!data) throw new ToolError(`No quote with id ${id}. Use ngms_list_quotes to find it.`)
  const { data: items, error: e2 } = await sb.from('quote_items').select(`${ITEM_COLS},service_id`).eq('quote_id', id).order('created_at')
  fail('Could not load quote items', e2)
  const { clients, ...quote } = data as unknown as Quote & { clients: Client | null }
  return { quote: quote as Quote, client: clients, items: (items ?? []) as Item[] }
}

export async function quoteById(sb: SupabaseClient, args: Args, key = 'quote_id') {
  return loadQuote(sb, uuid(args, key, 'from ngms_list_quotes')!)
}

export async function loadInvoice(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from('invoices').select(`${INVOICE_COLS}, clients(${CLIENT_COLS})`).eq('id', id).maybeSingle()
  fail('Database error', error)
  if (!data) throw new ToolError(`No invoice with id ${id}. Use ngms_list_invoices to find it.`)
  const { data: items, error: e2 } = await sb.from('invoice_items').select(ITEM_COLS).eq('invoice_id', id).order('created_at')
  fail('Could not load invoice items', e2)
  const { clients, ...invoice } = data as unknown as Invoice & { clients: Client | null }
  return { invoice: invoice as Invoice, client: clients, items: (items ?? []) as Item[] }
}

export function invoiceMoney(inv: Invoice, items: Pick<Item, 'quantity' | 'unit_price'>[]) {
  const subtotal = totals(items, false, 0).subtotal
  const total = r2(n0(inv.total_amount))
  const vat = r2(total - subtotal)
  const paid = r2(n0(inv.paid_amount))
  const balance = inv.status === 'void' ? 0 : r2(total - paid)
  const today = todaySast()
  const overdue = !['paid', 'void', 'draft'].includes(inv.status) && balance > 0.004 && !!inv.due_date && inv.due_date < today
  return { subtotal, vat: vat > 0.004 ? vat : 0, total, paid, balance, overdue, days_overdue: overdue ? Math.round((Date.parse(today) - Date.parse(inv.due_date!)) / 86400000) : 0 }
}

export function clientLine(c: Client | null): string {
  if (!c) return '_(no client linked)_'
  return [`**${c.name}**`, c.phone, c.email, [c.address, c.suburb].filter(Boolean).join(', ') || null].filter(Boolean).join(' · ')
}

export function quoteMoney(q: Quote, items: Item[], rate: number) {
  const t = totals(items, !!q.vat_included, rate)
  const deposit = r2(n0(q.deposit_amount))
  return { ...t, deposit, deposit_percent: pctOf(deposit, t.total), balance: r2(t.total - deposit) }
}

export function quoteDoc(q: Quote, client: Client | null, items: Item[], s: Settings, extra: string[] = []): string {
  const m = quoteMoney(q, items, s.vat_rate)
  const expired = q.status === 'sent' && !!q.valid_until && q.valid_until < todaySast()
  return [
    `## Quote ${q.quote_number} — ${q.status}${expired ? ' (past valid date)' : ''}`,
    `- **Client:** ${clientLine(client)}`,
    `- **Created:** ${sast(q.created_at)} · **Valid until:** ${q.valid_until ?? '—'}`,
    `- **ID:** \`${q.id}\`${q.lead_id ? ` · lead \`${q.lead_id}\`` : ''}`,
    '',
    itemTable(items),
    '',
    `**Subtotal:** ${rand(m.subtotal)}`,
    q.vat_included ? `**VAT (${s.vat_rate}%):** ${rand(m.vat)}` : '_Prices exclude VAT — not VAT registered._',
    `**Total:** ${rand(m.total)}`,
    `**Deposit (${m.deposit_percent}%):** ${rand(m.deposit)} · **Balance on completion:** ${rand(m.balance)}`,
    q.notes ? `\n### Notes\n${q.notes}` : null,
    ...extra,
  ]
    .filter((x) => x !== null)
    .join('\n')
}

export function invoiceDoc(inv: Invoice, client: Client | null, items: Item[], extra: string[] = []): string {
  const m = invoiceMoney(inv, items)
  return [
    `## Invoice ${inv.invoice_number} — ${inv.status}${m.overdue ? ` · ⚠️ ${m.days_overdue} day(s) overdue` : ''}`,
    `- **Client:** ${clientLine(client)}`,
    `- **Issued:** ${sast(inv.created_at)} · **Due:** ${inv.due_date ?? '—'}`,
    `- **ID:** \`${inv.id}\`${inv.quote_id ? ` · quote \`${inv.quote_id}\`` : ''}`,
    '',
    itemTable(items),
    '',
    `**Subtotal:** ${rand(m.subtotal)}`,
    m.vat ? `**VAT:** ${rand(m.vat)}` : '_Prices exclude VAT — not VAT registered._',
    `**Total:** ${rand(m.total)} · **Paid:** ${rand(m.paid)} · **Balance due:** ${rand(m.balance)}`,
    inv.notes ? `\n### Notes\n${inv.notes}` : null,
    ...extra,
  ]
    .filter((x) => x !== null)
    .join('\n')
}

export async function jobCosting(sb: SupabaseClient, job: Job, s: Settings) {
  const [costsRes, labourRes] = await Promise.all([
    sb.from('job_costs').select('id,category,description,amount,material_id,created_at').eq('job_id', job.id).order('created_at'),
    sb.from('labour_entries').select('id,employee_name,hours,rate_per_hour,date,created_at').eq('job_id', job.id).order('date'),
  ])
  fail('Could not load job costs', costsRes.error)
  fail('Could not load labour', labourRes.error)
  const costs = (costsRes.data ?? []) as { id: string; category: string; description: string | null; amount: number; created_at: string }[]
  const labour = (labourRes.data ?? []) as { id: string; employee_name: string; hours: number; rate_per_hour: number; date: string | null }[]

  const byCategory: Record<string, number> = {}
  for (const c of costs) byCategory[c.category] = r2((byCategory[c.category] ?? 0) + n0(c.amount))
  const labourCost = r2(labour.reduce((t, l) => t + r2(n0(l.hours) * n0(l.rate_per_hour)), 0))
  const labourHours = r2(labour.reduce((t, l) => t + n0(l.hours), 0))
  if (labourCost) byCategory['Labour'] = r2((byCategory['Labour'] ?? 0) + labourCost)
  const totalCost = r2(Object.values(byCategory).reduce((a, b) => a + b, 0))

  // Revenue (ex VAT) = the quoted contract value, or more if extra invoices were raised on the quote.
  let revenue = 0
  let invoiced = 0
  let revenueBasis = 'no quote linked — revenue unknown'
  if (job.quote_id) {
    const [{ data: invs }, { data: qi }] = await Promise.all([
      sb.from('invoices').select('id,status,invoice_items(quantity,unit_price)').eq('quote_id', job.quote_id).neq('status', 'void'),
      sb.from('quote_items').select('quantity,unit_price').eq('quote_id', job.quote_id),
    ])
    const invList = (invs ?? []) as unknown as { invoice_items: Item[] }[]
    const quoted = totals((qi ?? []) as Item[], false, s.vat_rate).subtotal
    invoiced = r2(invList.reduce((t, i) => t + totals(i.invoice_items ?? [], false, 0).subtotal, 0))
    revenue = Math.max(quoted, invoiced)
    revenueBasis = invoiced >= quoted - 0.004 ? `fully invoiced (${invList.length} invoice(s))` : `quoted value — ${rand(invoiced)} invoiced so far`
  }
  const profit = r2(revenue - totalCost)
  return {
    revenue_ex_vat: revenue,
    revenue_basis: revenueBasis,
    invoiced_ex_vat: invoiced,
    total_cost: totalCost,
    cost_by_category: byCategory,
    labour_hours: labourHours,
    gross_profit: profit,
    margin_percent: revenue > 0 ? pctOf(profit, revenue) : null,
    costs,
    labour,
  }
}

export function costingText(c: Awaited<ReturnType<typeof jobCosting>>): string {
  const lines = [
    '### Job costing',
    `**Revenue (ex VAT):** ${rand(c.revenue_ex_vat)} _(${c.revenue_basis})_`,
    `**Costs:** ${rand(c.total_cost)}${Object.keys(c.cost_by_category).length ? ' — ' + Object.entries(c.cost_by_category).map(([k, v]) => `${k} ${rand(v)}`).join(' · ') : ''}`,
    `**Gross profit:** ${rand(c.gross_profit)}${c.margin_percent !== null ? ` (${c.margin_percent}% margin)` : ''}`,
  ]
  if (c.labour.length) {
    lines.push('', '**Labour**', ...c.labour.map((l) => `- ${l.date ?? '—'} · ${l.employee_name} · ${n0(l.hours)}h × ${rand(n0(l.rate_per_hour))} = ${rand(n0(l.hours) * n0(l.rate_per_hour))} · id \`${l.id}\``))
  }
  if (c.costs.length) {
    lines.push('', '**Other costs**', ...c.costs.map((x) => `- ${x.category} · ${x.description ?? ''} · ${rand(n0(x.amount))} · id \`${x.id}\``))
  }
  return lines.join('\n')
}

export function weatherWarning(dateStr: string | null | undefined, text: string): string | null {
  if (!dateStr) return null
  const month = Number(dateStr.slice(5, 7))
  if (month >= 5 && month <= 8 && WET_WEATHER_TRADES.test(text)) {
    return '🌧️ Cape winter (May–Aug): painting/waterproofing/paving is rain-sensitive — check the forecast 48h out and keep a back-up date.'
  }
  return null
}
