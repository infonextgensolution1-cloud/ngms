import type { SupabaseClient } from '@supabase/supabase-js'
import { QUOTE_STATUSES, JOB_STATUSES, DEFAULT_DEPOSIT_PERCENT, OVERBERG, CLIENT_COLS, QUOTE_COLS, INVOICE_COLS, JOB_COLS, ToolError, fail, r2, n0, rand, todaySast, addDays, sast, str, num, int, bool, oneOf, uuid, date, normalisePhone, clean, ok, getSettings, resolveVat, insertNumbered, parseItems, attachServices, totals, pctOf, fetchClient, findClientByPhone, resolveClient, touchLead, loadQuote, quoteById, loadInvoice, invoiceMoney, clientLine, quoteMoney, quoteDoc, jobCosting } from './core'
import type { Client, Quote, Invoice, Job, Item, NewItem, Args, ToolResult } from './core'

// ================================================================ tool handlers

export type Handler = (sb: SupabaseClient, args: Args) => Promise<ToolResult>

export function page(args: Args) {
  const limit = int(args, 'limit', 20, 1, 100)
  const offset = int(args, 'offset', 0, 0, 100000)
  return { limit, offset }
}
export function pageInfo(total: number, count: number, offset: number) {
  const hasMore = offset + count < total
  return { total, count, offset, has_more: hasMore, ...(hasMore ? { next_offset: offset + count } : {}) }
}
export async function clientIdsMatching(sb: SupabaseClient, text: string): Promise<string[]> {
  const { data } = await sb.from('clients').select('id').ilike('name', `%${text}%`).limit(200)
  return ((data ?? []) as { id: string }[]).map((c) => c.id)
}

export async function invoiceFromArgs(sb: SupabaseClient, args: Args) {
  const id = uuid(args, 'invoice_id', 'from ngms_list_invoices', false)
  if (id) return loadInvoice(sb, id)
  const number = str(args, 'invoice_number', { max: 30 })
  if (!number) throw new ToolError('Give invoice_id or invoice_number.')
  const { data } = await sb.from('invoices').select('id').ilike('invoice_number', number).maybeSingle()
  if (!data) throw new ToolError(`No invoice numbered ${number}.`)
  return loadInvoice(sb, data.id)
}

export function appendNote(existing: string | null, note: string): string {
  const entry = `[${sast(new Date().toISOString())}] ${note}`
  return existing ? `${existing}\n${entry}` : entry
}

export async function writeItems(sb: SupabaseClient, table: 'quote_items' | 'invoice_items', fk: 'quote_id' | 'invoice_id', parentId: string, items: NewItem[]) {
  const rows = items.map((i) => ({
    [fk]: parentId,
    description: i.description,
    quantity: i.quantity,
    unit: i.unit,
    unit_price: i.unit_price,
    ...(table === 'quote_items' ? { service_id: i.service_id ?? null } : {}),
  }))
  const { error } = await sb.from(table).insert(rows)
  return error
}

export const handlersA: Record<string, Handler> = {
  // ---------------------------------------------------------- business
  async ngms_get_business_settings(sb) {
    const s = await getSettings(sb)
    const text = [
      `## ${s.business_name}`,
      `- **Phone:** ${s.phone ?? '—'} · **WhatsApp:** ${s.whatsapp ?? '—'} · **Email:** ${s.email ?? '—'}`,
      `- **Address:** ${s.address ?? '—'}`,
      `- **VAT:** ${s.vat_registered ? `registered (${s.vat_number}), ${s.vat_rate}%` : `not registered (${s.vat_number ?? 'no VAT number'}) — prices exclude VAT`}`,
      `- **Quote validity:** ${s.quote_expiry_days} days · **Default deposit:** ${DEFAULT_DEPOSIT_PERCENT}% / ${100 - DEFAULT_DEPOSIT_PERCENT}% on completion`,
      `- **Logo:** ${s.logo_url ? 'on file' : 'missing'}`,
      '',
      '### Banking details on file',
      s.bank_details ?? '_(none)_',
      '',
      '⚠️ Confirm the Capitec account number with the owner before it goes on a client document.',
    ].join('\n')
    return ok(text, { settings: s, default_deposit_percent: DEFAULT_DEPOSIT_PERCENT })
  },

  async ngms_business_summary(sb, args) {
    const sinceDays = int(args, 'since_days', 90, 1, 730)
    const since = new Date(Date.now() - sinceDays * 86400000).toISOString()
    const today = todaySast()
    const s = await getSettings(sb)

    const [qRes, iRes, jRes] = await Promise.all([
      sb.from('quotes').select(`${QUOTE_COLS}, clients(name), quote_items(quantity,unit_price)`).gte('created_at', since).limit(5000),
      sb.from('invoices').select(`${INVOICE_COLS}, clients(name), invoice_items(quantity,unit_price)`).neq('status', 'void').limit(5000),
      sb.from('jobs').select(`${JOB_COLS}, clients(name)`).limit(5000),
    ])
    fail('Could not load quotes', qRes.error)
    fail('Could not load invoices', iRes.error)
    fail('Could not load jobs', jRes.error)

    type QRow = Quote & { clients: { name: string } | null; quote_items: Item[] }
    type IRow = Invoice & { clients: { name: string } | null; invoice_items: Item[] }
    type JRow = Job & { clients: { name: string } | null }
    const quotes = (qRes.data ?? []) as unknown as QRow[]
    const invoices = (iRes.data ?? []) as unknown as IRow[]
    const jobs = (jRes.data ?? []) as unknown as JRow[]

    const qByStatus: Record<string, { count: number; value: number }> = {}
    for (const q of quotes) {
      const t = totals(q.quote_items ?? [], !!q.vat_included, s.vat_rate).total
      const e = (qByStatus[q.status] ??= { count: 0, value: 0 })
      e.count++
      e.value = r2(e.value + t)
    }
    const decided = (qByStatus.accepted?.count ?? 0) + (qByStatus.declined?.count ?? 0) + (qByStatus.expired?.count ?? 0)
    const winRate = decided ? pctOf(qByStatus.accepted?.count ?? 0, decided) : null
    const soon = addDays(today, 7)
    const expiring = quotes.filter((q) => q.status === 'sent' && q.valid_until && q.valid_until <= soon)

    const inv = invoices.map((i) => ({ i, m: invoiceMoney(i, i.invoice_items ?? []) }))
    const unpaid = inv.filter((x) => x.i.status !== 'paid' && x.i.status !== 'draft' && x.m.balance > 0.004)
    const overdue = unpaid.filter((x) => x.m.overdue).sort((a, b) => b.m.days_overdue - a.m.days_overdue)
    const drafts = inv.filter((x) => x.i.status === 'draft')
    const outstanding = r2(unpaid.reduce((t, x) => t + x.m.balance, 0))
    const overdueTotal = r2(overdue.reduce((t, x) => t + x.m.balance, 0))
    const collectedWindow = r2(inv.filter((x) => x.i.created_at >= since).reduce((t, x) => t + x.m.paid, 0))

    const jByStatus: Record<string, number> = {}
    for (const j of jobs) jByStatus[j.status] = (jByStatus[j.status] ?? 0) + 1
    const horizon = addDays(today, 14)
    const upcoming = jobs
      .filter((j) => ['scheduled', 'in_progress', 'on_hold'].includes(j.status) && j.scheduled_date && j.scheduled_date >= today && j.scheduled_date <= horizon)
      .sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!))
    const unscheduled = jobs.filter((j) => j.status === 'scheduled' && !j.scheduled_date)

    const completed = jobs.filter((j) => j.status === 'completed' && (j.completed_date ?? j.created_at.slice(0, 10)) >= since.slice(0, 10))
    const costings = await Promise.all(completed.slice(0, 60).map(async (j) => ({ j, c: await jobCosting(sb, j, s) })))
    const rev = r2(costings.reduce((t, x) => t + x.c.revenue_ex_vat, 0))
    const cost = r2(costings.reduce((t, x) => t + x.c.total_cost, 0))
    const thin = costings.filter((x) => x.c.margin_percent !== null && x.c.margin_percent < 25)

    const text = [
      `## NGSMS money summary — last ${sinceDays} days`,
      '',
      '### Quotes',
      QUOTE_STATUSES.map((st) => `${st}: ${qByStatus[st]?.count ?? 0} (${rand(qByStatus[st]?.value ?? 0)})`).join(' · '),
      winRate !== null ? `**Win rate:** ${winRate}% of decided quotes` : '_No quotes decided yet._',
      expiring.length ? `**Sent quotes expiring within 7 days / already past:** ${expiring.map((q) => `${q.quote_number} ${q.clients?.name ?? ''} (valid ${q.valid_until})`).join('; ')}` : null,
      '',
      '### Invoices',
      `**Outstanding:** ${rand(outstanding)} across ${unpaid.length} invoice(s) · **Overdue:** ${rand(overdueTotal)} (${overdue.length})`,
      `**Collected on invoices issued in window:** ${rand(collectedWindow)}${drafts.length ? ` · ${drafts.length} draft invoice(s) not sent yet` : ''}`,
      ...overdue.slice(0, 10).map((x) => `- ⚠️ ${x.i.invoice_number} · ${x.i.clients?.name ?? '—'} · ${rand(x.m.balance)} · ${x.m.days_overdue} day(s) overdue · id \`${x.i.id}\``),
      '',
      '### Jobs',
      JOB_STATUSES.map((st) => `${st}: ${jByStatus[st] ?? 0}`).join(' · '),
      upcoming.length ? `**Next 14 days:**\n${upcoming.map((j) => `- ${j.scheduled_date} · ${j.title ?? 'Untitled'} · ${j.clients?.name ?? '—'} · \`${j.status}\``).join('\n')}` : '_Nothing booked in the next 14 days._',
      unscheduled.length ? `**Booked but no date yet:** ${unscheduled.map((j) => j.title ?? j.id).join('; ')}` : null,
      '',
      '### Completed-job profit',
      completed.length
        ? `${completed.length} job(s) · revenue ${rand(rev)} · costs ${rand(cost)} · gross profit ${rand(rev - cost)}${rev > 0 ? ` (${pctOf(rev - cost, rev)}%)` : ''}`
        : '_No jobs completed in this window._',
      thin.length ? `**Thin margins (<25%):** ${thin.map((x) => `${x.j.title ?? x.j.id} ${x.c.margin_percent}%`).join('; ')}` : null,
    ]
      .filter((x) => x !== null)
      .join('\n')

    return ok(text, {
      window_days: sinceDays,
      quotes_by_status: qByStatus,
      quote_win_rate_percent: winRate,
      quotes_expiring: expiring.map((q) => ({ id: q.id, quote_number: q.quote_number, client: q.clients?.name ?? null, valid_until: q.valid_until })),
      invoices_outstanding_total: outstanding,
      invoices_outstanding_count: unpaid.length,
      invoices_overdue_total: overdueTotal,
      invoices_overdue: overdue.map((x) => ({ id: x.i.id, invoice_number: x.i.invoice_number, client: x.i.clients?.name ?? null, balance: x.m.balance, days_overdue: x.m.days_overdue })),
      draft_invoices: drafts.length,
      collected_in_window: collectedWindow,
      jobs_by_status: jByStatus,
      jobs_next_14_days: upcoming.map((j) => ({ id: j.id, title: j.title, client: j.clients?.name ?? null, scheduled_date: j.scheduled_date, status: j.status })),
      completed_jobs: completed.length,
      completed_revenue_ex_vat: rev,
      completed_cost: cost,
      completed_gross_profit: r2(rev - cost),
    })
  },

  // ---------------------------------------------------------- clients
  async ngms_list_clients(sb, args) {
    const { limit, offset } = page(args)
    const search = str(args, 'search', { max: 100 })
    const suburb = str(args, 'suburb', { max: 80 })
    let q = sb.from('clients').select(CLIENT_COLS, { count: 'exact' })
    if (suburb) q = q.ilike('suburb', `%${clean(suburb)}%`)
    if (search) {
      const s = clean(search)
      // "082 123 4567", "0821234567" and "+27 82…" should all match the stored +2782… format
      const digits = s.replace(/\D/g, '').replace(/^27(?=\d{9})/, '').replace(/^0/, '')
      const phoneTerm = digits.length >= 5 ? digits : s
      if (s) q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${phoneTerm}%,address.ilike.%${s}%`)
    }
    const { data, error, count } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    fail('Database error', error)
    const clients = (data ?? []) as Client[]
    const info = pageInfo(count ?? clients.length, clients.length, offset)
    const text = clients.length
      ? `**${info.total} client(s)**${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n${clients.map((c) => `- ${clientLine(c)}\n  id: \`${c.id}\``).join('\n')}`
      : 'No clients match.'
    return ok(text, { ...info, clients })
  },

  async ngms_save_client(sb, args) {
    const id = uuid(args, 'client_id', 'from ngms_list_clients', false)
    const patch: Record<string, unknown> = {}
    const name = str(args, 'name', { max: 120 })
    const phone = str(args, 'phone', { max: 30 })
    const email = str(args, 'email', { max: 160 })
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ToolError(`'${email}' is not a valid email.`)
    if (name) patch.name = name
    if (phone) patch.phone = normalisePhone(phone)
    if (email) patch.email = email
    for (const k of ['address', 'suburb', 'notes'] as const) {
      const v = str(args, k, { max: k === 'notes' ? 2000 : 300 })
      if (v !== undefined) patch[k] = v
    }
    if (id) {
      if (!Object.keys(patch).length) throw new ToolError('Nothing to update — pass at least one field.')
      await fetchClient(sb, id)
      const { data, error } = await sb.from('clients').update(patch).eq('id', id).select(CLIENT_COLS).single()
      fail('Could not update client', error)
      return ok(`Client updated.\n\n${clientLine(data as Client)}\nid: \`${id}\``, { client: data, created: false })
    }
    if (!name) throw new ToolError("'name' is required to create a client.")
    if (patch.phone) {
      const existing = await findClientByPhone(sb, patch.phone as string)
      if (existing) return ok(`A client with that phone already exists — not duplicated. Pass client_id to update it.\n\n${clientLine(existing)}\nid: \`${existing.id}\``, { client: existing, created: false })
    }
    const { data, error } = await sb.from('clients').insert(patch).select(CLIENT_COLS).single()
    fail('Could not create client', error)
    return ok(`Client added.\n\n${clientLine(data as Client)}\nid: \`${(data as Client).id}\``, { client: data, created: true })
  },

  // ---------------------------------------------------------- quotes
  async ngms_list_quotes(sb, args) {
    const { limit, offset } = page(args)
    const status = oneOf(args, 'status', QUOTE_STATUSES)
    const clientId = uuid(args, 'client_id', 'from ngms_list_clients', false)
    const search = str(args, 'search', { max: 100 })
    const sinceDays = num(args, 'since_days', { min: 1, max: 730, integer: true })
    const s = await getSettings(sb)

    let q = sb.from('quotes').select(`${QUOTE_COLS}, clients(name,suburb), quote_items(quantity,unit_price)`, { count: 'exact' })
    if (status) q = q.eq('status', status)
    else if (args.open_only === true) q = q.in('status', ['draft', 'sent'])
    if (clientId) q = q.eq('client_id', clientId)
    if (sinceDays) q = q.gte('created_at', new Date(Date.now() - sinceDays * 86400000).toISOString())
    if (search) {
      const txt = clean(search)
      const ids = await clientIdsMatching(sb, txt)
      q = q.or([`quote_number.ilike.%${txt}%`, ids.length ? `client_id.in.(${ids.join(',')})` : null].filter(Boolean).join(','))
    }
    const { data, error, count } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    fail('Database error', error)
    const today = todaySast()
    const rows = ((data ?? []) as unknown as (Quote & { clients: { name: string; suburb: string | null } | null; quote_items: Item[] })[]).map(({ quote_items, clients, ...qq }) => {
      const t = totals(quote_items ?? [], !!qq.vat_included, s.vat_rate)
      return { ...qq, client_name: clients?.name ?? null, client_suburb: clients?.suburb ?? null, subtotal: t.subtotal, total: t.total, past_valid_date: qq.status === 'sent' && !!qq.valid_until && qq.valid_until < today }
    })
    const info = pageInfo(count ?? rows.length, rows.length, offset)
    const text = rows.length
      ? `**${info.total} quote(s)**${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` +
        rows.map((r) => `- **${r.quote_number}** · ${r.client_name ?? '—'}${r.client_suburb ? `, ${r.client_suburb}` : ''} · ${rand(r.total)} · \`${r.status}\`${r.past_valid_date ? ' ⚠️ past valid date' : ''} · ${sast(r.created_at)}\n  id: \`${r.id}\``).join('\n')
      : 'No quotes match.'
    return ok(text, { ...info, quotes: rows })
  },

  async ngms_get_quote(sb, args) {
    let id = uuid(args, 'quote_id', 'from ngms_list_quotes', false)
    if (!id) {
      const number = str(args, 'quote_number', { max: 30 })
      if (!number) throw new ToolError('Give quote_id or quote_number.')
      const { data } = await sb.from('quotes').select('id').ilike('quote_number', number).maybeSingle()
      if (!data) throw new ToolError(`No quote numbered ${number}.`)
      id = data.id as string
    }
    const s = await getSettings(sb)
    const { quote, client, items } = await loadQuote(sb, id)
    const [{ data: jobs }, { data: invs }] = await Promise.all([
      sb.from('jobs').select('id,title,status,scheduled_date').eq('quote_id', id),
      sb.from('invoices').select('id,invoice_number,status,total_amount,paid_amount').eq('quote_id', id).order('created_at'),
    ])
    const extra: string[] = []
    if (jobs?.length) extra.push('', '### Jobs', ...jobs.map((j) => `- ${j.title ?? 'Job'} · \`${j.status}\` · ${j.scheduled_date ?? 'no date'} · id \`${j.id}\``))
    if (invs?.length) extra.push('', '### Invoices', ...invs.map((i) => `- ${i.invoice_number} · \`${i.status}\` · ${rand(n0(i.total_amount))} (paid ${rand(n0(i.paid_amount))}) · id \`${i.id}\``))
    return ok(quoteDoc(quote, client, items, s, extra), { quote, client, items, money: quoteMoney(quote, items, s.vat_rate), jobs: jobs ?? [], invoices: invs ?? [] })
  },

  async ngms_create_quote(sb, args) {
    const s = await getSettings(sb)
    const items = parseItems(args)
    await attachServices(sb, items)
    const vat = resolveVat(bool(args, 'apply_vat'), s)
    const t = totals(items, vat, s.vat_rate)
    if (t.total < 0) throw new ToolError('Quote total is negative — check discount lines.')
    const depAmt = num(args, 'deposit_amount', { min: 0 })
    const depPct = num(args, 'deposit_percent', { min: 0, max: 100 }) ?? DEFAULT_DEPOSIT_PERCENT
    const deposit = r2(depAmt ?? (t.total * depPct) / 100)
    if (deposit > t.total + 0.004) throw new ToolError(`Deposit ${rand(deposit)} is more than the total ${rand(t.total)}.`)
    const validDays = num(args, 'valid_days', { min: 1, max: 365, integer: true }) ?? s.quote_expiry_days
    const status = oneOf(args, 'status', ['draft', 'sent'] as const) ?? 'draft'
    const notes = str(args, 'notes', { max: 4000 })

    const { client, note: clientNote, leadId } = await resolveClient(sb, args)
    const quote = await insertNumbered<Quote>(sb, 'quotes', 'quote_number', 'Q', {
      client_id: client.id,
      lead_id: leadId,
      status,
      vat_included: vat,
      deposit_amount: deposit,
      total_amount: t.total,
      notes: notes ?? null,
      valid_until: addDays(todaySast(), validDays),
    }, QUOTE_COLS)
    const itemErr = await writeItems(sb, 'quote_items', 'quote_id', quote.id, items)
    if (itemErr) {
      await sb.from('quotes').delete().eq('id', quote.id)
      throw new ToolError(`Could not save quote lines (quote rolled back): ${itemErr.message}`)
    }
    const leadMsg = await touchLead(sb, leadId, 'quoted', `Quote ${quote.quote_number} created ${rand(t.total)}`)

    const warnings: string[] = []
    const allText = items.map((i) => i.description).join(' ')
    if (client.suburb && OVERBERG.test(client.suburb) && !/call.?out|travel/i.test(allText)) {
      warnings.push(`⚠️ ${client.suburb} is outside the Helderberg Basin — no callout line found. Standard is a flat R350 callout.`)
    }
    const loaded = await loadQuote(sb, quote.id)
    const extra = ['', ...[clientNote, leadMsg, ...warnings].filter((x): x is string => !!x)]
    return ok(`Quote created.\n\n${quoteDoc(loaded.quote, loaded.client, loaded.items, s, extra)}`, {
      quote: loaded.quote,
      client: loaded.client,
      items: loaded.items,
      money: quoteMoney(loaded.quote, loaded.items, s.vat_rate),
      warnings,
    })
  },

  async ngms_update_quote(sb, args) {
    const s = await getSettings(sb)
    const { quote, items: oldItems } = await quoteById(sb, args)
    const patch: Record<string, unknown> = {}
    const changed: string[] = []

    const newItems = args.items !== undefined ? parseItems(args) : null
    if (newItems) {
      const { count } = await sb.from('invoices').select('id', { count: 'exact', head: true }).eq('quote_id', quote.id).neq('status', 'void')
      if (count) throw new ToolError(`${quote.quote_number} already has ${count} invoice(s) — line items are locked. Void those invoices first or create a new quote.`)
      await attachServices(sb, newItems)
    }
    const vatArg = bool(args, 'apply_vat')
    const vat = vatArg === undefined ? !!quote.vat_included : resolveVat(vatArg, s)
    if (vat !== !!quote.vat_included) changed.push(vat ? 'VAT added' : 'VAT removed')

    const oldTotal = totals(oldItems, !!quote.vat_included, s.vat_rate).total
    const t = totals(newItems ?? oldItems, vat, s.vat_rate)
    if (t.total < 0) throw new ToolError('Quote total is negative — check discount lines.')
    const depAmt = num(args, 'deposit_amount', { min: 0 })
    const depPct = num(args, 'deposit_percent', { min: 0, max: 100 })
    let deposit = r2(n0(quote.deposit_amount))
    if (depAmt !== undefined) deposit = r2(depAmt)
    else if (depPct !== undefined) deposit = r2((t.total * depPct) / 100)
    else if (t.total !== oldTotal) deposit = oldTotal > 0 ? r2((deposit / oldTotal) * t.total) : r2((t.total * DEFAULT_DEPOSIT_PERCENT) / 100)
    if (deposit > t.total + 0.004) throw new ToolError(`Deposit ${rand(deposit)} is more than the total ${rand(t.total)}.`)
    if (deposit !== r2(n0(quote.deposit_amount))) changed.push(`deposit ${rand(deposit)}`)
    if (t.total !== r2(n0(quote.total_amount))) changed.push(`total ${rand(t.total)}`)
    patch.vat_included = vat
    patch.deposit_amount = deposit
    patch.total_amount = t.total

    const validUntil = date(args, 'valid_until')
    if (validUntil && validUntil !== quote.valid_until) {
      patch.valid_until = validUntil
      changed.push(`valid until ${validUntil}`)
    }
    const notes = str(args, 'notes', { max: 4000 })
    if (notes !== undefined && notes !== quote.notes) {
      patch.notes = notes
      changed.push('notes')
    }
    const status = oneOf(args, 'status', QUOTE_STATUSES)
    if (status && status !== quote.status) {
      patch.status = status
      changed.push(`status ${quote.status} → ${status}`)
    }
    if (newItems) changed.push(`${newItems.length} line(s) replaced`)
    if (!changed.length) {
      const cur = await loadQuote(sb, quote.id)
      return ok(`Nothing to change.\n\n${quoteDoc(cur.quote, cur.client, cur.items, s)}`, { quote: cur.quote, changed: [] })
    }
    patch.updated_at = new Date().toISOString()

    if (newItems) {
      const { error: delErr } = await sb.from('quote_items').delete().eq('quote_id', quote.id)
      fail('Could not replace quote lines', delErr)
      const insErr = await writeItems(sb, 'quote_items', 'quote_id', quote.id, newItems)
      if (insErr) {
        await writeItems(sb, 'quote_items', 'quote_id', quote.id, oldItems.map((i) => ({ ...i, id: undefined })))
        throw new ToolError(`Could not save new lines (old lines restored): ${insErr.message}`)
      }
    }
    const { error } = await sb.from('quotes').update(patch).eq('id', quote.id)
    fail('Could not update quote', error)

    let leadMsg: string | null = null
    if (status === 'accepted') leadMsg = await touchLead(sb, quote.lead_id, 'won', `Quote ${quote.quote_number} accepted ${rand(t.total)}`)
    else if (status === 'declined') leadMsg = await touchLead(sb, quote.lead_id, 'lost', `Quote ${quote.quote_number} declined`)
    else if (status === 'sent') leadMsg = await touchLead(sb, quote.lead_id, 'quoted', `Quote ${quote.quote_number} sent ${rand(t.total)}`)

    const cur = await loadQuote(sb, quote.id)
    const next = status === 'accepted' ? '\n\nNext: ngms_create_invoice (kind "deposit") and ngms_create_job with this quote_id.' : ''
    return ok(`Updated: ${changed.join(', ')}.${leadMsg ? ` ${leadMsg}` : ''}${next}\n\n${quoteDoc(cur.quote, cur.client, cur.items, s)}`, {
      quote: cur.quote,
      items: cur.items,
      money: quoteMoney(cur.quote, cur.items, s.vat_rate),
      changed,
    })
  },
}
