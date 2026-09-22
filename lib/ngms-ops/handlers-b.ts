import type { SupabaseClient } from '@supabase/supabase-js'
import { INVOICE_STATUSES, JOB_STATUSES, COST_CATEGORIES, INVOICE_KINDS, PAY_METHODS, DEFAULT_DUE_DAYS, CLIENT_COLS, INVOICE_COLS, JOB_COLS, ToolError, fail, r2, n0, rand, todaySast, addDays, str, num, bool, oneOf, uuid, date, clean, ok, getSettings, resolveVat, insertNumbered, parseItems, totals, pctOf, resolveClient, touchLead, loadQuote, loadInvoice, invoiceMoney, clientLine, invoiceDoc, jobCosting, costingText, weatherWarning } from './core'
import type { Client, Quote, Invoice, Job, Item, NewItem, ToolResult } from './core'
import { type Handler, page, pageInfo, clientIdsMatching, invoiceFromArgs, appendNote, writeItems } from './handlers-a'

export const handlersB: Record<string, Handler> = {
  // ---------------------------------------------------------- invoices
  async ngms_list_invoices(sb, args) {
    const { limit, offset } = page(args)
    const status = oneOf(args, 'status', INVOICE_STATUSES)
    const clientId = uuid(args, 'client_id', 'from ngms_list_clients', false)
    const search = str(args, 'search', { max: 100 })
    const unpaid = args.unpaid_only === true
    const overdueOnly = args.overdue_only === true

    let q = sb.from('invoices').select(`${INVOICE_COLS}, clients(name), invoice_items(quantity,unit_price)`, { count: 'exact' })
    if (status) q = q.eq('status', status)
    else if (unpaid || overdueOnly) q = q.not('status', 'in', '(paid,void)')
    if (overdueOnly) q = q.lt('due_date', todaySast()).neq('status', 'draft')
    if (clientId) q = q.eq('client_id', clientId)
    if (search) {
      const txt = clean(search)
      const ids = await clientIdsMatching(sb, txt)
      q = q.or([`invoice_number.ilike.%${txt}%`, ids.length ? `client_id.in.(${ids.join(',')})` : null].filter(Boolean).join(','))
    }
    const { data, error, count } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    fail('Database error', error)
    const rows = ((data ?? []) as unknown as (Invoice & { clients: { name: string } | null; invoice_items: Item[] })[]).map(({ invoice_items, clients, ...inv }) => ({
      ...inv,
      client_name: clients?.name ?? null,
      ...invoiceMoney(inv as Invoice, invoice_items ?? []),
    }))
    const info = pageInfo(count ?? rows.length, rows.length, offset)
    const outstanding = r2(rows.filter((r) => r.status !== 'draft').reduce((t, r) => t + r.balance, 0))
    const text = rows.length
      ? `**${info.total} invoice(s)** · balance outstanding on this page: ${rand(outstanding)}${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` +
        rows.map((r) => `- **${r.invoice_number}** · ${r.client_name ?? '—'} · ${rand(r.total)} · paid ${rand(r.paid)} · due ${r.due_date ?? '—'} · \`${r.status}\`${r.overdue ? ` ⚠️ ${r.days_overdue}d overdue` : ''}\n  id: \`${r.id}\``).join('\n')
      : 'No invoices match.'
    return ok(text, { ...info, outstanding_on_page: outstanding, invoices: rows })
  },

  async ngms_get_invoice(sb, args) {
    const s = await getSettings(sb)
    const { invoice, client, items } = await invoiceFromArgs(sb, args)
    let quoteNumber: string | null = null
    if (invoice.quote_id) {
      const { data } = await sb.from('quotes').select('quote_number').eq('id', invoice.quote_id).maybeSingle()
      quoteNumber = data?.quote_number ?? null
    }
    const business = {
      name: s.business_name, phone: s.phone, whatsapp: s.whatsapp, email: s.email, address: s.address,
      vat_number: s.vat_registered ? s.vat_number : null, bank_details: s.bank_details, logo_url: s.logo_url,
    }
    const extra = [
      quoteNumber ? `\n_Quote reference: ${quoteNumber}_` : null,
      '',
      '### Pay to',
      s.bank_details ?? '_(no banking details in settings)_',
      `Reference: ${invoice.invoice_number}`,
      '',
      '⚠️ Confirm the Capitec account number with the owner before sending.',
    ].filter((x): x is string => x !== null)
    return ok(invoiceDoc(invoice, client, items, extra), { invoice, client, items, money: invoiceMoney(invoice, items), quote_number: quoteNumber, business })
  },

  async ngms_create_invoice(sb, args) {
    const s = await getSettings(sb)
    const quoteId = uuid(args, 'quote_id', 'from ngms_list_quotes', false)
    const status = oneOf(args, 'status', ['draft', 'sent'] as const) ?? 'draft'
    const notes = str(args, 'notes', { max: 4000 })
    const allowDup = args.allow_duplicate === true
    let items: NewItem[]
    let vat: boolean
    let clientId: string
    let kind: (typeof INVOICE_KINDS)[number] = 'full'
    const preface: string[] = []

    if (quoteId) {
      if (args.items !== undefined || args.client_id !== undefined || args.client !== undefined) {
        throw new ToolError('With quote_id, the client and lines come from the quote — drop items/client_id/client.')
      }
      kind = oneOf(args, 'kind', INVOICE_KINDS) ?? 'full'
      const { quote, items: qItems } = await loadQuote(sb, quoteId)
      if (!quote.client_id) throw new ToolError(`${quote.quote_number} has no client — set one first.`)
      clientId = quote.client_id
      vat = !!quote.vat_included
      if (['declined', 'expired'].includes(quote.status)) throw new ToolError(`${quote.quote_number} is ${quote.status}. Set it back to accepted first if the client went ahead.`)

      const { data: prior, error } = await sb.from('invoices').select('id,invoice_number,status,notes,invoice_items(quantity,unit_price)').eq('quote_id', quoteId).neq('status', 'void')
      fail('Could not check existing invoices', error)
      const priorList = (prior ?? []) as unknown as { id: string; invoice_number: string; notes: string | null; invoice_items: Item[] }[]
      const tag = (k: string) => `[${k} invoice for ${quote.quote_number}]`
      const priorOfKind = (k: string) => priorList.filter((p) => p.notes?.includes(tag(k)))
      if (!allowDup) {
        if (priorOfKind(kind).length) throw new ToolError(`A ${kind} invoice for ${quote.quote_number} already exists (${priorOfKind(kind).map((p) => p.invoice_number).join(', ')}). Pass allow_duplicate: true if you really want another.`)
        if (kind === 'full' && priorList.length) throw new ToolError(`${quote.quote_number} already has invoice(s) ${priorList.map((p) => p.invoice_number).join(', ')}. Use kind "balance" to bill what's left.`)
        if (kind === 'deposit' && priorOfKind('full').length + priorOfKind('balance').length) throw new ToolError(`${quote.quote_number} has already been fully/balance invoiced.`)
      }

      const qSubtotal = totals(qItems, false, 0).subtotal
      if (kind === 'full') {
        items = qItems.map((i) => ({ description: i.description, quantity: n0(i.quantity), unit: i.unit, unit_price: n0(i.unit_price) }))
      } else if (kind === 'deposit') {
        const dep = r2(n0(quote.deposit_amount))
        if (dep <= 0) throw new ToolError(`${quote.quote_number} has no deposit set — use ngms_update_quote with deposit_percent first.`)
        const exVat = vat ? r2(dep / (1 + s.vat_rate / 100)) : dep
        const pct = pctOf(dep, n0(quote.total_amount))
        items = [{ description: `Deposit (${pct}%) — ${quote.quote_number}`, quantity: 1, unit: 'item', unit_price: exVat }]
      } else {
        const alreadyEx = r2(priorList.reduce((t, p) => t + totals(p.invoice_items ?? [], false, 0).subtotal, 0))
        if (alreadyEx >= qSubtotal - 0.004) throw new ToolError(`${quote.quote_number} is already fully invoiced (${priorList.map((p) => p.invoice_number).join(', ')}).`)
        items = [
          ...qItems.map((i) => ({ description: i.description, quantity: n0(i.quantity), unit: i.unit, unit_price: n0(i.unit_price) })),
          ...(alreadyEx > 0 ? [{ description: `Less: already invoiced (${priorList.map((p) => p.invoice_number).join(', ')})`, quantity: 1, unit: 'item', unit_price: -alreadyEx }] : []),
        ]
      }
      if (['draft', 'sent'].includes(quote.status)) preface.push(`Note: ${quote.quote_number} is still \`${quote.status}\` — mark it accepted with ngms_update_quote if the client has said yes.`)
      const kindTag = tag(kind)
      const dueDays = num(args, 'due_days', { min: 0, max: 120, integer: true }) ?? (kind === 'deposit' ? 0 : DEFAULT_DUE_DAYS)
      return finishInvoice(sb, { clientId, quoteId, items, vat, status, dueDays, notes: [kindTag, notes].filter(Boolean).join('\n'), preface, rate: s.vat_rate })
    }

    // standalone
    items = parseItems(args)
    vat = resolveVat(bool(args, 'apply_vat'), s)
    const res = await resolveClient(sb, args)
    clientId = res.client.id
    if (res.note) preface.push(res.note)
    const dueDays = num(args, 'due_days', { min: 0, max: 120, integer: true }) ?? DEFAULT_DUE_DAYS
    return finishInvoice(sb, { clientId, quoteId: null, items, vat, status, dueDays, notes: notes ?? null, preface, rate: s.vat_rate })
  },

  async ngms_record_payment(sb, args) {
    const { invoice, items } = await invoiceFromArgs(sb, args)
    if (invoice.status === 'void') throw new ToolError(`${invoice.invoice_number} is void — can't take payment on it.`)
    const amount = r2(num(args, 'amount', { required: true, min: 0.01, max: 100_000_000 })!)
    const m = invoiceMoney(invoice, items)
    if (amount > m.balance + 0.004) throw new ToolError(`${rand(amount)} is more than the balance due ${rand(m.balance)} on ${invoice.invoice_number}.`)
    const paidOn = date(args, 'paid_on') ?? todaySast()
    const method = oneOf(args, 'method', PAY_METHODS) ?? 'eft'
    const ref = str(args, 'reference', { max: 120 })
    const newPaid = r2(m.paid + amount)
    const newStatus = newPaid >= m.total - 0.004 ? 'paid' : 'partial'
    const logLine = `Payment ${rand(amount)} received ${paidOn} via ${method.toUpperCase()}${ref ? ` (ref ${ref})` : ''}`
    const { error } = await sb.from('invoices').update({ paid_amount: newPaid, status: newStatus, notes: appendNote(invoice.notes, logLine) }).eq('id', invoice.id)
    fail('Could not record payment', error)
    const cur = await loadInvoice(sb, invoice.id)
    return ok(`${logLine}. ${invoice.invoice_number} is now **${newStatus}**.\n\n${invoiceDoc(cur.invoice, cur.client, cur.items)}`, { invoice: cur.invoice, money: invoiceMoney(cur.invoice, cur.items) })
  },

  async ngms_update_invoice(sb, args) {
    const { invoice, items } = await invoiceFromArgs(sb, args)
    const patch: Record<string, unknown> = {}
    const changed: string[] = []
    const status = oneOf(args, 'status', ['draft', 'sent', 'void'] as const)
    if (status && status !== invoice.status) {
      if (status === 'void' && n0(invoice.paid_amount) > 0) throw new ToolError(`${invoice.invoice_number} has ${rand(n0(invoice.paid_amount))} paid — can't void it. Issue a credit instead.`)
      if (['paid', 'partial'].includes(invoice.status) && status !== 'void') throw new ToolError(`${invoice.invoice_number} is ${invoice.status}; status follows payments now.`)
      patch.status = status
      changed.push(`status ${invoice.status} → ${status}`)
    }
    const due = date(args, 'due_date')
    if (due && due !== invoice.due_date) {
      patch.due_date = due
      changed.push(`due ${due}`)
    }
    const note = str(args, 'note', { max: 2000 })
    const logParts = [changed.length ? changed.join(', ') : null, note ?? null].filter(Boolean)
    if (!logParts.length) throw new ToolError('Nothing to change — pass status, due_date or note.')
    patch.notes = appendNote(invoice.notes, logParts.join(' — '))
    if (note) changed.push('note added')
    const { error } = await sb.from('invoices').update(patch).eq('id', invoice.id)
    fail('Could not update invoice', error)
    const cur = await loadInvoice(sb, invoice.id)
    return ok(`Updated: ${changed.join(', ')}.\n\n${invoiceDoc(cur.invoice, cur.client, cur.items)}`, { invoice: cur.invoice, money: invoiceMoney(cur.invoice, items), changed })
  },

  // ---------------------------------------------------------- jobs
  async ngms_list_jobs(sb, args) {
    const { limit, offset } = page(args)
    const status = oneOf(args, 'status', JOB_STATUSES)
    const clientId = uuid(args, 'client_id', 'from ngms_list_clients', false)
    const from = date(args, 'from_date')
    const to = date(args, 'to_date')
    let q = sb.from('jobs').select(`${JOB_COLS}, clients(name,suburb,phone)`, { count: 'exact' })
    if (status) q = q.eq('status', status)
    else if (args.open_only === true) q = q.in('status', ['scheduled', 'in_progress', 'on_hold'])
    if (clientId) q = q.eq('client_id', clientId)
    if (from) q = q.gte('scheduled_date', from)
    if (to) q = q.lte('scheduled_date', to)
    q = from || to ? q.order('scheduled_date', { ascending: true }) : q.order('created_at', { ascending: false })
    const { data, error, count } = await q.range(offset, offset + limit - 1)
    fail('Database error', error)
    const rows = ((data ?? []) as unknown as (Job & { clients: { name: string; suburb: string | null; phone: string | null } | null })[]).map(({ clients, ...j }) => ({
      ...j,
      client_name: clients?.name ?? null,
      client_suburb: clients?.suburb ?? null,
      client_phone: clients?.phone ?? null,
    }))
    const info = pageInfo(count ?? rows.length, rows.length, offset)
    const text = rows.length
      ? `**${info.total} job(s)**${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` +
        rows.map((j) => `- ${j.scheduled_date ?? 'no date'} · **${j.title ?? 'Untitled'}** · ${j.client_name ?? '—'}${j.client_suburb ? `, ${j.client_suburb}` : ''} · \`${j.status}\`\n  id: \`${j.id}\``).join('\n')
      : 'No jobs match.'
    return ok(text, { ...info, jobs: rows })
  },

  async ngms_get_job(sb, args) {
    const id = uuid(args, 'job_id', 'from ngms_list_jobs')!
    const s = await getSettings(sb)
    const { data, error } = await sb.from('jobs').select(`${JOB_COLS}, clients(${CLIENT_COLS}), quotes(quote_number,status)`).eq('id', id).maybeSingle()
    fail('Database error', error)
    if (!data) throw new ToolError(`No job with id ${id}.`)
    const { clients, quotes, ...job } = data as unknown as Job & { clients: Client | null; quotes: { quote_number: string; status: string } | null }
    const costing = await jobCosting(sb, job as Job, s)
    const text = [
      `## Job: ${job.title ?? 'Untitled'} — ${job.status}`,
      `- **Client:** ${clientLine(clients)}`,
      `- **Scheduled:** ${job.scheduled_date ?? '—'} · **Completed:** ${job.completed_date ?? '—'}`,
      quotes ? `- **Quote:** ${quotes.quote_number} (${quotes.status})` : null,
      `- **ID:** \`${job.id}\``,
      job.description ? `\n### Scope & site notes\n${job.description}` : null,
      '',
      costingText(costing),
    ]
      .filter((x) => x !== null)
      .join('\n')
    return ok(text, { job, client: clients, quote: quotes, costing })
  },

  async ngms_create_job(sb, args) {
    const quoteId = uuid(args, 'quote_id', 'from ngms_list_quotes', false)
    const scheduled = date(args, 'scheduled_date') ?? null
    let title = str(args, 'title', { max: 200 })
    let description = str(args, 'description', { max: 4000 })
    let clientId: string
    const notes: string[] = []

    if (quoteId) {
      const { quote, client, items } = await loadQuote(sb, quoteId)
      if (!quote.client_id) throw new ToolError(`${quote.quote_number} has no client.`)
      if (['declined', 'expired'].includes(quote.status)) throw new ToolError(`${quote.quote_number} is ${quote.status} — accept it first if the client went ahead.`)
      const { data: existing } = await sb.from('jobs').select('id,title,status').eq('quote_id', quoteId).neq('status', 'cancelled')
      if (existing?.length) notes.push(`Heads-up: ${quote.quote_number} already has job(s): ${existing.map((j) => `${j.title} (${j.status})`).join('; ')}.`)
      clientId = quote.client_id
      title ??= `${items[0]?.description.split(/[—–-]/)[0].trim() ?? 'Job'}${items.length > 1 ? ` +${items.length - 1}` : ''} — ${client?.name ?? ''}${client?.suburb ? `, ${client.suburb}` : ''}`.slice(0, 200)
      const scope = `Scope from ${quote.quote_number}:\n${items.map((i) => `- ${i.description} (${n0(i.quantity)} ${i.unit ?? ''})`).join('\n')}`
      description = description ? `${description}\n\n${scope}` : scope
      if (['draft', 'sent'].includes(quote.status)) {
        await sb.from('quotes').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', quote.id)
        const leadMsg = await touchLead(sb, quote.lead_id, 'won', `Quote ${quote.quote_number} accepted — job booked`)
        notes.push(`${quote.quote_number} marked accepted.${leadMsg ? ` ${leadMsg}` : ''}`)
      }
    } else {
      if (!title) throw new ToolError("'title' is required for a job without a quote.")
      const res = await resolveClient(sb, args)
      clientId = res.client.id
      if (res.note) notes.push(res.note)
    }

    const { data, error } = await sb
      .from('jobs')
      .insert({ client_id: clientId, quote_id: quoteId ?? null, title, description: description ?? null, status: 'scheduled', scheduled_date: scheduled })
      .select(JOB_COLS)
      .single()
    fail('Could not create job', error)
    const job = data as Job
    const w = weatherWarning(scheduled, `${title} ${description ?? ''}`)
    if (w) notes.push(w)
    if (!scheduled) notes.push('No date set yet — use ngms_update_job with scheduled_date.')
    return ok(`Job booked: **${job.title}** · ${job.scheduled_date ?? 'no date'} · id \`${job.id}\`${notes.length ? '\n\n' + notes.join('\n') : ''}`, { job, notes })
  },

  async ngms_update_job(sb, args) {
    const id = uuid(args, 'job_id', 'from ngms_list_jobs')!
    const { data: cur, error: e0 } = await sb.from('jobs').select(JOB_COLS).eq('id', id).maybeSingle()
    fail('Database error', e0)
    if (!cur) throw new ToolError(`No job with id ${id}.`)
    const job = cur as Job
    const patch: Record<string, unknown> = {}
    const changed: string[] = []
    const status = oneOf(args, 'status', JOB_STATUSES)
    if (status && status !== job.status) {
      patch.status = status
      changed.push(`status ${job.status} → ${status}`)
    }
    const sched = date(args, 'scheduled_date')
    if (sched && sched !== job.scheduled_date) {
      patch.scheduled_date = sched
      changed.push(`rescheduled ${job.scheduled_date ?? '—'} → ${sched}`)
    }
    const done = date(args, 'completed_date') ?? (status === 'completed' && !job.completed_date ? todaySast() : undefined)
    if (done && done !== job.completed_date) {
      patch.completed_date = done
      changed.push(`completed ${done}`)
    }
    const title = str(args, 'title', { max: 200 })
    if (title && title !== job.title) {
      patch.title = title
      changed.push('title')
    }
    const note = str(args, 'note', { max: 2000 })
    if (note || changed.length) {
      const logLine = [changed.filter((c) => c !== 'title').join(', '), note].filter(Boolean).join(' — ')
      if (logLine) patch.description = appendNote(job.description, logLine)
      if (note) changed.push('note added')
    }
    if (!changed.length) throw new ToolError('Nothing to change — pass status, scheduled_date, completed_date, title or note.')
    const { data, error } = await sb.from('jobs').update(patch).eq('id', id).select(JOB_COLS).single()
    fail('Could not update job', error)
    const extra: string[] = []
    const w = sched ? weatherWarning(sched, `${job.title} ${job.description ?? ''}`) : null
    if (w) extra.push(w)
    if (status === 'completed') {
      extra.push('Next: ngms_create_invoice with kind "balance" on the quote, and log any last costs so the margin is right.')
      if (job.quote_id) {
        const { count } = await sb.from('invoices').select('id', { count: 'exact', head: true }).eq('quote_id', job.quote_id).neq('status', 'void')
        if (!count) extra.push('⚠️ No invoice raised against this job\'s quote yet.')
      }
    }
    return ok(`Updated: ${changed.join(', ')}.${extra.length ? '\n\n' + extra.join('\n') : ''}`, { job: data, changed })
  },

  async ngms_log_labour(sb, args) {
    const jobId = uuid(args, 'job_id', 'from ngms_list_jobs')!
    const { data: job } = await sb.from('jobs').select('id,title').eq('id', jobId).maybeSingle()
    if (!job) throw new ToolError(`No job with id ${jobId}.`)
    const employee = str(args, 'employee_name', { required: true, max: 120 })!
    const hours = num(args, 'hours', { required: true, min: 0.1, max: 24 })!
    const rate = r2(num(args, 'rate_per_hour', { required: true, min: 0, max: 100000 })!)
    const d = date(args, 'date') ?? todaySast()
    const { data, error } = await sb.from('labour_entries').insert({ job_id: jobId, employee_name: employee, hours, rate_per_hour: rate, date: d }).select('*').single()
    fail('Could not log labour', error)
    return ok(`Logged ${hours}h for ${employee} on ${d} at ${rand(rate)}/h = ${rand(hours * rate)} → ${job.title ?? jobId}. id \`${data.id}\``, { labour_entry: data, cost: r2(hours * rate) })
  },

  async ngms_add_job_cost(sb, args) {
    const jobId = uuid(args, 'job_id', 'from ngms_list_jobs')!
    const { data: job } = await sb.from('jobs').select('id,title').eq('id', jobId).maybeSingle()
    if (!job) throw new ToolError(`No job with id ${jobId}.`)
    const category = oneOf(args, 'category', COST_CATEGORIES)
    if (!category) throw new ToolError(`'category' is required: ${COST_CATEGORIES.join(', ')}.`)
    const amountArg = num(args, 'amount', { min: 0, max: 100_000_000 })
    const qty = num(args, 'quantity', { min: 0.001, max: 1_000_000 })
    const unitPrice = num(args, 'unit_price', { min: 0, max: 100_000_000 })
    let amount: number
    if (amountArg !== undefined) amount = r2(amountArg)
    else if (qty !== undefined && unitPrice !== undefined) amount = r2(qty * unitPrice)
    else throw new ToolError('Give amount, or quantity and unit_price.')
    const materialId = uuid(args, 'material_id', 'from ngms_list_materials', false) ?? null
    let description = str(args, 'description', { max: 300 })
    const extra: string[] = []
    if (materialId) {
      const { data: mat } = await sb.from('materials').select('id,description,unit,last_price').eq('id', materialId).maybeSingle()
      if (!mat) throw new ToolError(`No material with id ${materialId}.`)
      description ??= `${mat.description}${mat.unit ? ` (${mat.unit})` : ''}`
      if (args.update_material_price === true && unitPrice !== undefined && unitPrice !== n0(mat.last_price)) {
        await sb.from('materials').update({ last_price: r2(unitPrice), last_checked: todaySast() }).eq('id', materialId)
        extra.push(`Material price updated ${rand(n0(mat.last_price))} → ${rand(unitPrice)}.`)
      }
    }
    if (qty !== undefined && unitPrice !== undefined && amountArg === undefined) description = `${description ?? category} (${qty} × ${rand(unitPrice)})`
    const { data, error } = await sb.from('job_costs').insert({ job_id: jobId, category, description: description ?? null, amount, material_id: materialId }).select('*').single()
    fail('Could not add cost', error)
    return ok(`${category} cost ${rand(amount)} added to ${job.title ?? jobId}. id \`${data.id}\`${extra.length ? '\n' + extra.join('\n') : ''}`, { cost: data })
  },

  async ngms_delete_job_cost(sb, args) {
    const costId = uuid(args, 'cost_id', 'from ngms_get_job', false)
    const labourId = uuid(args, 'labour_entry_id', 'from ngms_get_job', false)
    if (!costId === !labourId) throw new ToolError('Give exactly one of cost_id or labour_entry_id.')
    const table = costId ? 'job_costs' : 'labour_entries'
    const { data, error } = await sb.from(table).delete().eq('id', (costId ?? labourId)!).select('*')
    fail('Could not delete', error)
    if (!data?.length) return ok('Nothing deleted — that entry no longer exists.', { deleted: null })
    return ok(`Deleted ${costId ? 'cost' : 'labour'} entry \`${data[0].id}\`.`, { deleted: data[0] })
  },

  // ---------------------------------------------------------- materials
  async ngms_list_materials(sb, args) {
    const { limit, offset } = page(args)
    const search = str(args, 'search', { max: 100 })
    const supplier = str(args, 'supplier', { max: 80 })
    let q = sb.from('materials').select('*', { count: 'exact' })
    if (search) {
      const s = clean(search)
      q = q.or(`description.ilike.%${s}%,sku.ilike.%${s}%`)
    }
    if (supplier) q = q.ilike('supplier', `%${clean(supplier)}%`)
    const { data, error, count } = await q.order('description').range(offset, offset + limit - 1)
    fail('Database error', error)
    const rows = (data ?? []) as { id: string; description: string; supplier: string | null; sku: string | null; unit: string | null; last_price: number | null; last_checked: string | null }[]
    const info = pageInfo(count ?? rows.length, rows.length, offset)
    const text = rows.length
      ? `**${info.total} material(s)**${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` +
        rows.map((m) => `- ${m.description}${m.unit ? ` (${m.unit})` : ''} · ${m.last_price !== null ? rand(n0(m.last_price)) : 'no price'} · ${m.supplier ?? '—'}${m.sku ? ` #${m.sku}` : ''} · checked ${m.last_checked ?? '—'}\n  id: \`${m.id}\``).join('\n')
      : 'No materials on file yet — add them with ngms_save_material.'
    return ok(text, { ...info, materials: rows })
  },

  async ngms_save_material(sb, args) {
    const id = uuid(args, 'material_id', 'from ngms_list_materials', false)
    const patch: Record<string, unknown> = {}
    for (const [k, max] of [['description', 300], ['supplier', 80], ['sku', 60], ['unit', 30]] as const) {
      const v = str(args, k, { max })
      if (v !== undefined) patch[k] = v
    }
    const price = num(args, 'last_price', { min: 0, max: 100_000_000 })
    if (price !== undefined) {
      patch.last_price = r2(price)
      patch.last_checked = date(args, 'last_checked') ?? todaySast()
    } else {
      const lc = date(args, 'last_checked')
      if (lc) patch.last_checked = lc
    }
    if (id) {
      if (!Object.keys(patch).length) throw new ToolError('Nothing to update.')
      const { data, error } = await sb.from('materials').update(patch).eq('id', id).select('*').maybeSingle()
      fail('Could not update material', error)
      if (!data) throw new ToolError(`No material with id ${id}.`)
      return ok(`Material updated: ${data.description} · ${data.last_price !== null ? rand(n0(data.last_price)) : 'no price'}`, { material: data })
    }
    if (!patch.description) throw new ToolError("'description' is required for a new material.")
    patch.supplier ??= 'Builders Warehouse'
    const { data, error } = await sb.from('materials').insert(patch).select('*').single()
    fail('Could not add material', error)
    return ok(`Material added: ${data.description} · ${data.last_price !== null ? rand(n0(data.last_price)) : 'no price'} · id \`${data.id}\``, { material: data })
  },
}

async function finishInvoice(
  sb: SupabaseClient,
  o: { clientId: string; quoteId: string | null; items: NewItem[]; vat: boolean; status: string; dueDays: number; notes: string | null; preface: string[]; rate: number }
): Promise<ToolResult> {
  const t = totals(o.items, o.vat, o.rate)
  if (t.total <= 0) throw new ToolError('Invoice total must be more than R0.')
  const inv = await insertNumbered<Invoice>(sb, 'invoices', 'invoice_number', 'INV', {
    client_id: o.clientId,
    quote_id: o.quoteId,
    status: o.status,
    total_amount: t.total,
    paid_amount: 0,
    due_date: addDays(todaySast(), o.dueDays),
    notes: o.notes,
  }, INVOICE_COLS)
  const err = await writeItems(sb, 'invoice_items', 'invoice_id', inv.id, o.items)
  if (err) {
    await sb.from('invoices').delete().eq('id', inv.id)
    throw new ToolError(`Could not save invoice lines (invoice rolled back): ${err.message}`)
  }
  const cur = await loadInvoice(sb, inv.id)
  const extra = o.preface.length ? ['', ...o.preface] : []
  extra.push('', 'Use ngms_get_invoice for the full document with banking details (confirm the Capitec account number before sending).')
  return ok(`Invoice created.\n\n${invoiceDoc(cur.invoice, cur.client, cur.items, extra)}`, { invoice: cur.invoice, client: cur.client, items: cur.items, money: invoiceMoney(cur.invoice, cur.items) })
}
