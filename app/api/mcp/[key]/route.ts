import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'

/**
 * NGSMS Leads MCP server
 * ----------------------
 * Lets Claude (or any MCP client) read and work the website/admin leads
 * pipeline in the NGMS Supabase project (dfwwpqtsbaytfqptancj).
 *
 * Connector URL (add in Claude → Settings → Connectors → Add custom connector):
 *   https://www.nextgensolarmaintenance.co.za/api/mcp/<MCP_ACCESS_KEY>
 *
 * Needs TWO environment variables in Vercel → ngms-new → Settings →
 * Environment Variables (Production), then a redeploy:
 *   MCP_ACCESS_KEY             long random string — acts as the password in the URL
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API Keys → service_role
 *                              (server-only; never put it in NEXT_PUBLIC_ vars)
 *
 * Transport: MCP Streamable HTTP, stateless, plain JSON responses.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SERVER_INFO = { name: 'ngsms-leads', title: 'NGSMS Leads', version: '1.0.0' }
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']

const STATUSES = ['new', 'contacted', 'site_visit', 'quoted', 'won', 'lost'] as const
const SOURCES = ['website', 'phone', 'whatsapp', 'referral', 'bc-outreach', 'facebook', 'other'] as const
const LEAD_COLUMNS =
  'id,name,phone,email,suburb,service,service_slug,message,status,source,notes,photo_url,created_at,updated_at'

type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  suburb: string | null
  service: string | null
  service_slug: string | null
  message: string | null
  status: string
  source: string
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

type Args = Record<string, unknown>
type ToolResult = {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

// ---------------------------------------------------------------- helpers

class ToolError extends Error {}

function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dfwwpqtsbaytfqptancj.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new ToolError(
      'Server not configured: SUPABASE_SERVICE_ROLE_KEY is missing in Vercel env vars. Add it, then redeploy.'
    )
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function sast(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function str(args: Args, key: string, opts: { required?: boolean; max?: number } = {}): string | undefined {
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

function int(args: Args, key: string, def: number, min: number, max: number): number {
  const v = args[key]
  if (v === undefined || v === null) return def
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw new ToolError(`'${key}' must be a whole number between ${min} and ${max}.`)
  }
  return n
}

function oneOf<T extends readonly string[]>(args: Args, key: string, allowed: T): T[number] | undefined {
  const v = str(args, key)
  if (v === undefined) return undefined
  if (!(allowed as readonly string[]).includes(v)) {
    throw new ToolError(`'${key}' must be one of: ${allowed.join(', ')}. Got '${v}'.`)
  }
  return v as T[number]
}

function uuid(args: Args, key = 'lead_id'): string {
  const v = str(args, key, { required: true })!
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    throw new ToolError(`'${key}' must be a lead UUID (get it from ngms_list_leads).`)
  }
  return v
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  if (/^0\d{9}$/.test(digits)) return '+27' + digits.slice(1)
  if (/^27\d{9}$/.test(digits)) return '+' + digits
  return digits || raw
}

function waLink(phone: string): string | null {
  const d = normalisePhone(phone).replace(/\D/g, '')
  return /^27\d{9}$/.test(d) ? `https://wa.me/${d}` : null
}

function leadLine(l: Lead): string {
  const svc = l.service || l.service_slug || 'service not given'
  const area = l.suburb || 'area not given'
  return `- **${l.name}** — ${svc}, ${area} · \`${l.status}\` · ${l.source} · ${sast(l.created_at)} · ${l.phone}\n  id: \`${l.id}\``
}

function leadDetail(l: Lead): string {
  const wa = waLink(l.phone)
  return [
    `## ${l.name}`,
    `- **Status:** ${l.status}   **Source:** ${l.source}`,
    `- **Phone:** ${l.phone}${wa ? ` (WhatsApp: ${wa})` : ''}`,
    l.email ? `- **Email:** ${l.email}` : null,
    `- **Area:** ${l.suburb || '—'}`,
    `- **Service:** ${l.service || l.service_slug || '—'}`,
    `- **Received:** ${sast(l.created_at)}   **Last updated:** ${sast(l.updated_at)}`,
    l.photo_url ? `- **Photo:** ${l.photo_url}` : null,
    `- **ID:** \`${l.id}\``,
    '',
    '### Enquiry',
    l.message || '_(no message)_',
    '',
    '### Notes',
    l.notes || '_(no notes yet)_',
  ]
    .filter((x) => x !== null)
    .join('\n')
}

function ok(text: string, structured?: Record<string, unknown>): ToolResult {
  return { content: [{ type: 'text', text }], ...(structured ? { structuredContent: structured } : {}) }
}

async function validServiceSlugs(sb: SupabaseClient): Promise<{ slug: string; name: string }[]> {
  const { data, error } = await sb.from('services').select('slug,name').order('slug')
  if (error) throw new ToolError(`Could not load services: ${error.message}`)
  return (data ?? []) as { slug: string; name: string }[]
}

async function fetchLead(sb: SupabaseClient, id: string): Promise<Lead> {
  const { data, error } = await sb.from('leads').select(LEAD_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new ToolError(`Database error: ${error.message}`)
  if (!data) throw new ToolError(`No lead with id ${id}. Use ngms_list_leads to find the right id.`)
  return data as Lead
}

// ---------------------------------------------------------------- tools

const leadOutput = { type: 'object', additionalProperties: true }

const TOOLS = [
  {
    name: 'ngms_list_leads',
    title: 'List leads',
    description:
      'List NGSMS leads (website quote requests plus leads added manually from calls, WhatsApp, referrals and body-corporate outreach), newest first. Filter by status, service, area, source, age, or free-text search across name/phone/email/message. Returns lead ids for use with the other tools.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: [...STATUSES], description: 'Pipeline stage to filter on.' },
        open_only: {
          type: 'boolean',
          description: 'If true, only leads not yet won or lost. Ignored when status is given.',
        },
        service_slug: { type: 'string', description: "Service slug, e.g. 'solar-panel-cleaning'. See ngms_list_services." },
        suburb: { type: 'string', description: "Partial area match, e.g. 'Strand', 'Somerset'." },
        source: { type: 'string', enum: [...SOURCES] },
        since_days: { type: 'integer', minimum: 1, maximum: 730, description: 'Only leads received in the last N days.' },
        search: { type: 'string', description: 'Text to find in name, phone, email or message.' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        offset: { type: 'integer', minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        count: { type: 'integer' },
        offset: { type: 'integer' },
        has_more: { type: 'boolean' },
        next_offset: { type: 'integer', description: 'Present only when has_more is true.' },
        leads: { type: 'array', items: leadOutput },
      },
      required: ['total', 'count', 'offset', 'has_more', 'leads'],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ngms_get_lead',
    title: 'Get lead',
    description: 'Get one lead in full — contact details, WhatsApp link, enquiry text and the running notes history.',
    inputSchema: {
      type: 'object',
      properties: { lead_id: { type: 'string', description: 'Lead UUID from ngms_list_leads.' } },
      required: ['lead_id'],
      additionalProperties: false,
    },
    outputSchema: { type: 'object', properties: { lead: leadOutput }, required: ['lead'] },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ngms_create_lead',
    title: 'Add lead',
    description:
      'Add a lead that came in by phone, WhatsApp, referral, Facebook or body-corporate outreach so it sits in the same pipeline as website leads. SA numbers like 063 138 7945 are stored as +27…. Warns if a lead with the same phone already exists.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 120, description: 'Client or complex name, e.g. "Mrs Botha" or "Oceans Edge BC".' },
        phone: { type: 'string', maxLength: 30 },
        email: { type: 'string', maxLength: 160 },
        suburb: { type: 'string', maxLength: 80, description: 'e.g. Strand, Gordon\'s Bay, Somerset West, Kleinmond.' },
        service_slug: { type: 'string', description: 'Must match a slug from ngms_list_services.' },
        message: { type: 'string', maxLength: 4000, description: 'What they asked for — size, panel count, m², urgency.' },
        source: { type: 'string', enum: [...SOURCES.filter((s) => s !== 'website')], default: 'phone' },
        status: { type: 'string', enum: [...STATUSES], default: 'new' },
      },
      required: ['name', 'phone'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: { lead: leadOutput, possible_duplicates: { type: 'array', items: leadOutput } },
      required: ['lead'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'ngms_update_lead',
    title: 'Update lead',
    description:
      'Move a lead through the pipeline and/or log a note. Stages: new → contacted → site_visit → quoted → won / lost. A note is appended with a SAST timestamp (existing notes are never overwritten). Also fixes contact details or service if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string' },
        status: { type: 'string', enum: [...STATUSES] },
        note: { type: 'string', maxLength: 2000, description: 'e.g. "Called, site visit Thu 10:00" or "Quote Q-0142 sent R2,850".' },
        name: { type: 'string', maxLength: 120 },
        phone: { type: 'string', maxLength: 30 },
        email: { type: 'string', maxLength: 160 },
        suburb: { type: 'string', maxLength: 80 },
        service_slug: { type: 'string' },
      },
      required: ['lead_id'],
      additionalProperties: false,
    },
    outputSchema: { type: 'object', properties: { lead: leadOutput, changed: { type: 'array', items: { type: 'string' } } }, required: ['lead', 'changed'] },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: 'ngms_pipeline_summary',
    title: 'Pipeline summary',
    description:
      'Snapshot of the leads pipeline: counts per stage, per service, per source and per area, new leads in the last 24h / 7 days, and "stale" open leads nobody has touched for N days (default 3) — the ones to follow up today.',
    inputSchema: {
      type: 'object',
      properties: {
        since_days: { type: 'integer', minimum: 1, maximum: 730, default: 90, description: 'Window of leads to count, by received date.' },
        stale_after_days: { type: 'integer', minimum: 1, maximum: 60, default: 3 },
      },
      additionalProperties: false,
    },
    outputSchema: { type: 'object', additionalProperties: true },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'ngms_list_services',
    title: 'List services',
    description: 'List the service slugs and names used on leads (solar-panel-cleaning, painting, waterproofing, …).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: {
      type: 'object',
      properties: { services: { type: 'array', items: { type: 'object', additionalProperties: true } } },
      required: ['services'],
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
] as const

async function callTool(name: string, args: Args): Promise<ToolResult> {
  switch (name) {
    case 'ngms_list_leads': {
      const sb = db()
      const status = oneOf(args, 'status', STATUSES)
      const source = oneOf(args, 'source', SOURCES)
      const serviceSlug = str(args, 'service_slug')
      const suburb = str(args, 'suburb', { max: 80 })
      const search = str(args, 'search', { max: 100 })
      const sinceDays = args.since_days === undefined ? undefined : int(args, 'since_days', 30, 1, 730)
      const limit = int(args, 'limit', 20, 1, 100)
      const offset = int(args, 'offset', 0, 0, 100000)

      let q = sb.from('leads').select(LEAD_COLUMNS, { count: 'exact' })
      if (status) q = q.eq('status', status)
      else if (args.open_only === true) q = q.not('status', 'in', '(won,lost)')
      if (source) q = q.eq('source', source)
      if (serviceSlug) q = q.eq('service_slug', serviceSlug)
      if (suburb) q = q.ilike('suburb', `%${suburb.replace(/[%_,()]/g, '')}%`)
      if (sinceDays) q = q.gte('created_at', new Date(Date.now() - sinceDays * 86400000).toISOString())
      if (search) {
        const s = search.replace(/[%_,()*]/g, ' ').trim()
        if (s) q = q.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,message.ilike.%${s}%`)
      }
      const { data, error, count } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
      if (error) throw new ToolError(`Database error: ${error.message}`)

      const leads = (data ?? []) as Lead[]
      const total = count ?? leads.length
      const hasMore = offset + leads.length < total
      const text = leads.length
        ? `**${total} lead(s) match** — showing ${offset + 1}–${offset + leads.length}${hasMore ? ` (next_offset ${offset + leads.length})` : ''}\n\n${leads.map(leadLine).join('\n')}`
        : 'No leads match those filters.'
      return ok(text, {
        total,
        count: leads.length,
        offset,
        has_more: hasMore,
        ...(hasMore ? { next_offset: offset + leads.length } : {}),
        leads,
      })
    }

    case 'ngms_get_lead': {
      const sb = db()
      const lead = await fetchLead(sb, uuid(args))
      return ok(leadDetail(lead), { lead })
    }

    case 'ngms_create_lead': {
      const sb = db()
      const name = str(args, 'name', { required: true, max: 120 })!
      const phone = normalisePhone(str(args, 'phone', { required: true, max: 30 })!)
      const email = str(args, 'email', { max: 160 })
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ToolError(`'${email}' is not a valid email.`)
      const suburb = str(args, 'suburb', { max: 80 })
      const message = str(args, 'message', { max: 4000 })
      const source = oneOf(args, 'source', SOURCES) ?? 'phone'
      const status = oneOf(args, 'status', STATUSES) ?? 'new'
      const slug = str(args, 'service_slug')
      let serviceName: string | null = null
      if (slug) {
        const services = await validServiceSlugs(sb)
        const hit = services.find((s) => s.slug === slug)
        if (!hit) throw new ToolError(`Unknown service_slug '${slug}'. Valid: ${services.map((s) => s.slug).join(', ')}`)
        serviceName = hit.name
      }

      const tail = phone.replace(/\D/g, '').slice(-9)
      const { data: dupes } = await sb.from('leads').select(LEAD_COLUMNS).ilike('phone', `%${tail}`).limit(5)

      const { data, error } = await sb
        .from('leads')
        .insert({
          name,
          phone,
          email: email ?? null,
          suburb: suburb ?? null,
          service: serviceName,
          service_slug: slug ?? null,
          message: message ?? null,
          source,
          status,
        })
        .select(LEAD_COLUMNS)
        .single()
      if (error) throw new ToolError(`Could not save lead: ${error.message}`)
      const lead = data as Lead
      const dupList = ((dupes ?? []) as Lead[]).filter((d) => d.id !== lead.id)
      const warn = dupList.length
        ? `\n\n⚠️ Same phone number already on ${dupList.length} other lead(s):\n${dupList.map(leadLine).join('\n')}`
        : ''
      return ok(`Lead added.\n\n${leadDetail(lead)}${warn}`, { lead, possible_duplicates: dupList })
    }

    case 'ngms_update_lead': {
      const sb = db()
      const id = uuid(args)
      const current = await fetchLead(sb, id)
      const patch: Record<string, unknown> = {}
      const changed: string[] = []

      const status = oneOf(args, 'status', STATUSES)
      if (status && status !== current.status) {
        patch.status = status
        changed.push(`status ${current.status} → ${status}`)
      }
      for (const field of ['name', 'email', 'suburb'] as const) {
        const v = str(args, field, { max: field === 'email' ? 160 : 120 })
        if (v !== undefined && v !== current[field]) {
          patch[field] = v
          changed.push(field)
        }
      }
      const phoneRaw = str(args, 'phone', { max: 30 })
      if (phoneRaw) {
        const p = normalisePhone(phoneRaw)
        if (p !== current.phone) {
          patch.phone = p
          changed.push('phone')
        }
      }
      const slug = str(args, 'service_slug')
      if (slug && slug !== current.service_slug) {
        const services = await validServiceSlugs(sb)
        const hit = services.find((s) => s.slug === slug)
        if (!hit) throw new ToolError(`Unknown service_slug '${slug}'. Valid: ${services.map((s) => s.slug).join(', ')}`)
        patch.service_slug = slug
        patch.service = hit.name
        changed.push('service')
      }
      const note = str(args, 'note', { max: 2000 })
      const now = new Date().toISOString()
      if (note || patch.status) {
        const entry = `[${sast(now)}]${patch.status ? ` (${current.status} → ${patch.status})` : ''} ${note ?? ''}`.trim()
        patch.notes = current.notes ? `${current.notes}\n${entry}` : entry
        if (note) changed.push('note added')
      }
      if (!Object.keys(patch).length) {
        return ok(`Nothing to change — lead already matches.\n\n${leadDetail(current)}`, { lead: current, changed: [] })
      }
      patch.updated_at = now

      const { data, error } = await sb.from('leads').update(patch).eq('id', id).select(LEAD_COLUMNS).single()
      if (error) throw new ToolError(`Could not update lead: ${error.message}`)
      const lead = data as Lead
      return ok(`Updated: ${changed.join(', ')}.\n\n${leadDetail(lead)}`, { lead, changed })
    }

    case 'ngms_pipeline_summary': {
      const sb = db()
      const sinceDays = int(args, 'since_days', 90, 1, 730)
      const staleDays = int(args, 'stale_after_days', 3, 1, 60)
      const { data, error } = await sb
        .from('leads')
        .select(LEAD_COLUMNS)
        .gte('created_at', new Date(Date.now() - sinceDays * 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(2000)
      if (error) throw new ToolError(`Database error: ${error.message}`)
      const leads = (data ?? []) as Lead[]
      const now = Date.now()
      const tally = (key: (l: Lead) => string) =>
        leads.reduce<Record<string, number>>((acc, l) => {
          const k = key(l) || 'unknown'
          acc[k] = (acc[k] ?? 0) + 1
          return acc
        }, {})
      const byStatus = tally((l) => l.status)
      const byService = tally((l) => l.service_slug || l.service || 'unspecified')
      const bySource = tally((l) => l.source)
      const byArea = tally((l) => (l.suburb || 'unspecified').trim())
      const last24h = leads.filter((l) => now - Date.parse(l.created_at) < 86400000).length
      const last7d = leads.filter((l) => now - Date.parse(l.created_at) < 7 * 86400000).length
      const stale = leads
        .filter((l) => !['won', 'lost'].includes(l.status) && now - Date.parse(l.updated_at) > staleDays * 86400000)
        .sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at))
      const won = byStatus.won ?? 0
      const lost = byStatus.lost ?? 0
      const winRate = won + lost ? Math.round((won / (won + lost)) * 100) : null

      const fmt = (o: Record<string, number>) =>
        Object.entries(o)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')
      const text = [
        `## Leads pipeline — last ${sinceDays} days (${leads.length} leads)`,
        `**New:** ${last24h} in last 24h · ${last7d} in last 7 days`,
        `**By stage:** ${STATUSES.map((s) => `${s}: ${byStatus[s] ?? 0}`).join(' · ')}`,
        winRate !== null ? `**Win rate (won vs lost):** ${winRate}%` : null,
        `**By service:** ${fmt(byService) || '—'}`,
        `**By source:** ${fmt(bySource) || '—'}`,
        `**By area:** ${fmt(byArea) || '—'}`,
        '',
        stale.length
          ? `### Follow up — ${stale.length} open lead(s) untouched for ${staleDays}+ days\n${stale.slice(0, 15).map(leadLine).join('\n')}`
          : `No open leads older than ${staleDays} days without an update. 👍`,
      ]
        .filter((x) => x !== null)
        .join('\n')
      return ok(text, {
        window_days: sinceDays,
        total: leads.length,
        new_last_24h: last24h,
        new_last_7d: last7d,
        by_status: byStatus,
        by_service: byService,
        by_source: bySource,
        by_area: byArea,
        win_rate_percent: winRate,
        stale_after_days: staleDays,
        stale_leads: stale.slice(0, 50),
      })
    }

    case 'ngms_list_services': {
      const services = await validServiceSlugs(db())
      return ok(services.map((s) => `- \`${s.slug}\` — ${s.name}`).join('\n'), { services })
    }

    default:
      throw new ToolError(`Unknown tool '${name}'. Available: ${TOOLS.map((t) => t.name).join(', ')}`)
  }
}

// ---------------------------------------------------------------- JSON-RPC / MCP plumbing

type RpcMessage = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> }

function rpcResult(id: RpcMessage['id'], result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result }
}
function rpcError(id: RpcMessage['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

async function handleMessage(msg: RpcMessage) {
  const isNotification = msg.id === undefined
  if (msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return isNotification ? null : rpcError(msg.id, -32600, 'Invalid JSON-RPC request')
  }
  if (isNotification) return null // notifications/initialized etc. — nothing to do

  switch (msg.method) {
    case 'initialize': {
      const requested = String(msg.params?.protocolVersion ?? '')
      return rpcResult(msg.id, {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Leads pipeline for NextGen Solar Clean & Maintenance Solutions (Helderberg: Strand, Gordon\'s Bay, Somerset West; plus Overberg). ' +
          'Start with ngms_pipeline_summary for a daily overview, ngms_list_leads to find leads, and ngms_update_lead to log calls, quotes and outcomes. ' +
          'Times are SAST. Prices are in ZAR.',
      })
    }
    case 'ping':
      return rpcResult(msg.id, {})
    case 'tools/list':
      return rpcResult(msg.id, { tools: TOOLS })
    case 'tools/call': {
      const name = String(msg.params?.name ?? '')
      const args = (msg.params?.arguments ?? {}) as Args
      if (typeof args !== 'object' || Array.isArray(args)) {
        return rpcError(msg.id, -32602, 'arguments must be an object')
      }
      if (!TOOLS.some((t) => t.name === name)) return rpcError(msg.id, -32602, `Unknown tool: ${name}`)
      try {
        return rpcResult(msg.id, await callTool(name, args))
      } catch (err) {
        const text = err instanceof ToolError ? err.message : `Unexpected error: ${(err as Error)?.message ?? err}`
        if (!(err instanceof ToolError)) console.error('[mcp] tool error', name, err)
        return rpcResult(msg.id, { content: [{ type: 'text', text }], isError: true })
      }
    }
    case 'resources/list':
      return rpcResult(msg.id, { resources: [] })
    case 'prompts/list':
      return rpcResult(msg.id, { prompts: [] })
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

function authorised(key: string, request: Request): boolean {
  const expected = process.env.MCP_ACCESS_KEY
  if (!expected || expected.length < 24) return false
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const given = Buffer.from(bearer || key || '')
  const want = Buffer.from(expected)
  return given.length === want.length && timingSafeEqual(given, want)
}

function json(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

export async function POST(request: Request, { params }: { params: { key: string } }) {
  if (!authorised(params.key, request)) {
    // 404 rather than 401 so the endpoint doesn't advertise itself.
    return json({ error: 'Not found' }, 404)
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(rpcError(null, -32700, 'Parse error'), 400)
  }

  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleMessage(m as RpcMessage)))).filter(Boolean)
    return out.length ? json(out) : new Response(null, { status: 202 })
  }
  const out = await handleMessage(body as RpcMessage)
  return out ? json(out) : new Response(null, { status: 202 })
}

// Stateless server: no server-initiated SSE stream, no sessions to delete.
export async function GET() {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } })
}
export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } })
}
