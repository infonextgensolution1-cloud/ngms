import type { SupabaseClient } from '@supabase/supabase-js'
import {
  WORKER_CATEGORIES, WORKER_STATUSES, ACCOUNT_TYPES, WORKER_DOC_TYPES, PAYSLIP_PERIODS,
  PURCHASE_CATEGORIES, PAYMENT_STATUSES, PHOTO_TYPES, JOB_COLS,
  WORKER_COLS, SUPPLIER_COLS, PURCHASE_COLS, PAYSLIP_COLS,
  ToolError, fail, r2, n0, rand, todaySast, str, num, bool, oneOf, uuid, date, clean, ok,
} from './core'
import type { Worker, Supplier, SupplierPurchase, Payslip } from './core'
import type { Handler } from './handlers-a'
import { page as pageFn, pageInfo as pageInfoFn } from './handlers-a'

// NGSMS Ops — wages/payroll, materials suppliers & purchases, job photo reports.
// Sits alongside handlers-a/b (business, clients, quotes, invoices, jobs, materials).

function workerLine(w: Worker): string {
  return `**${w.name}** · ${w.category} · ${rand(n0(w.daily_rate))}/day · \`${w.status}\``
}

export const handlersC: Record<string, Handler> = {
  // ---------------------------------------------------------- workers
  async ngms_list_workers(sb, args) {
    const { limit, offset } = pageFn(args)
    const status = oneOf(args, 'status', WORKER_STATUSES)
    const search = str(args, 'search', { max: 100 })
    let q = sb.from('workers').select(WORKER_COLS, { count: 'exact' })
    if (status) q = q.eq('status', status)
    else if (args.active_only === true) q = q.in('status', ['active', 'temp'])
    if (search) q = q.ilike('name', `%${clean(search)}%`)
    const { data, error, count } = await q.order('name').range(offset, offset + limit - 1)
    fail('Database error', error)
    const rows = (data ?? []) as Worker[]
    const info = pageInfoFn(count ?? rows.length, rows.length, offset)
    const text = rows.length
      ? `**${info.total} worker(s)**${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` + rows.map((w) => `- ${workerLine(w)}\n  id: \`${w.id}\``).join('\n')
      : 'No workers on file yet — add one with ngms_save_worker.'
    return ok(text, { ...info, workers: rows })
  },

  async ngms_get_worker(sb, args) {
    const id = uuid(args, 'worker_id', 'from ngms_list_workers')!
    const { data, error } = await sb.from('workers').select(WORKER_COLS).eq('id', id).maybeSingle()
    fail('Database error', error)
    if (!data) throw new ToolError(`No worker with id ${id}.`)
    const worker = data as Worker
    const [{ data: docs }, { data: slips }] = await Promise.all([
      sb.from('worker_documents').select('id,doc_type,file_url,file_name,uploaded_at').eq('worker_id', id).order('uploaded_at', { ascending: false }),
      sb.from('payslips').select(PAYSLIP_COLS).eq('worker_id', id).order('period_start', { ascending: false }).limit(10),
    ])
    const text = [
      `## ${worker.name} — ${worker.category} · \`${worker.status}\``,
      `- **Phone:** ${worker.phone ?? '—'} · **Started:** ${worker.start_date ?? '—'} · **Daily rate:** ${rand(n0(worker.daily_rate))}`,
      worker.bank_name ? `- **Banking:** ${worker.bank_name} · ${worker.account_holder ?? ''} · ${worker.account_number ?? ''}` : '- **Banking:** not on file',
      `- **ID:** \`${worker.id}\``,
      worker.notes ? `\n### Notes\n${worker.notes}` : null,
      '',
      slips?.length ? `**Recent payslips (${slips.length})**\n` + slips.map((p: Payslip) => `- ${p.period_start} → ${p.period_end ?? '—'} · net ${rand(n0(p.net_pay))} · id \`${p.id}\``).join('\n') : '_No payslips generated yet — use ngms_generate_payslip._',
    ].filter((x) => x !== null).join('\n')
    return ok(text, { worker, documents: docs ?? [], recent_payslips: slips ?? [] })
  },

  async ngms_save_worker(sb, args) {
    const id = uuid(args, 'worker_id', 'from ngms_list_workers', false)
    const patch: Record<string, unknown> = {}
    for (const [k, max] of [
      ['name', 120], ['id_number', 20], ['phone', 30], ['email', 160], ['emergency_contact_name', 120], ['emergency_contact_phone', 30],
      ['notes', 2000], ['bank_name', 60], ['account_holder', 120], ['account_number', 40], ['branch_code', 20], ['payment_reference', 80],
    ] as const) {
      const v = str(args, k, { max })
      if (v !== undefined) patch[k] = v
    }
    const category = oneOf(args, 'category', WORKER_CATEGORIES)
    if (category) patch.category = category
    const status = oneOf(args, 'status', WORKER_STATUSES)
    if (status) patch.status = status
    const accountType = oneOf(args, 'account_type', ACCOUNT_TYPES)
    if (accountType) patch.account_type = accountType
    const startDate = date(args, 'start_date')
    if (startDate) patch.start_date = startDate
    const dailyRate = num(args, 'daily_rate', { min: 0, max: 100_000 })
    if (dailyRate !== undefined) patch.daily_rate = r2(dailyRate)

    if (id) {
      if (!Object.keys(patch).length) throw new ToolError('Nothing to update.')
      patch.updated_at = new Date().toISOString()
      const { data, error } = await sb.from('workers').update(patch).eq('id', id).select(WORKER_COLS).maybeSingle()
      fail('Could not update worker', error)
      if (!data) throw new ToolError(`No worker with id ${id}.`)
      return ok(`Worker updated: ${workerLine(data as Worker)}`, { worker: data })
    }
    if (!patch.name) throw new ToolError("'name' is required for a new worker.")
    patch.category ??= 'General Worker'
    patch.status ??= 'active'
    patch.daily_rate ??= 0
    const { data, error } = await sb.from('workers').insert(patch).select(WORKER_COLS).single()
    fail('Could not add worker', error)
    return ok(`Worker added: ${workerLine(data as Worker)} · id \`${data.id}\``, { worker: data })
  },

  async ngms_save_worker_document(sb, args) {
    const workerId = uuid(args, 'worker_id', 'from ngms_list_workers')!
    const { data: w } = await sb.from('workers').select('id,name').eq('id', workerId).maybeSingle()
    if (!w) throw new ToolError(`No worker with id ${workerId}.`)
    const docType = oneOf(args, 'doc_type', WORKER_DOC_TYPES) ?? 'other'
    const fileUrl = str(args, 'file_url', { required: true, max: 2000 })!
    const fileName = str(args, 'file_name', { max: 200 })
    const { data, error } = await sb.from('worker_documents').insert({ worker_id: workerId, doc_type: docType, file_url: fileUrl, file_name: fileName ?? null }).select('*').single()
    fail('Could not save document', error)
    return ok(`Document saved for ${w.name}: ${docType}. id \`${data.id}\``, { document: data })
  },

  async ngms_delete_worker_document(sb, args) {
    const id = uuid(args, 'document_id', 'from ngms_get_worker')!
    const { data, error } = await sb.from('worker_documents').delete().eq('id', id).select('*')
    fail('Could not delete document', error)
    if (!data?.length) return ok('Nothing deleted — that document no longer exists.', { deleted: null })
    return ok(`Deleted document \`${data[0].id}\`.`, { deleted: data[0] })
  },

  // ---------------------------------------------------------- payroll
  async ngms_generate_payslip(sb, args) {
    const workerId = uuid(args, 'worker_id', 'from ngms_list_workers')!
    const { data: w } = await sb.from('workers').select(WORKER_COLS).eq('id', workerId).maybeSingle()
    if (!w) throw new ToolError(`No worker with id ${workerId}.`)
    const worker = w as Worker
    const period = oneOf(args, 'period', PAYSLIP_PERIODS) ?? 'weekly'
    const periodStart = date(args, 'period_start') ?? todaySast()
    const periodEnd = date(args, 'period_end') ?? null
    const daysWorked = num(args, 'days_worked', { required: true, min: 0, max: 62 })!
    const absentDays = num(args, 'absent_days', { min: 0, max: 62 }) ?? 0
    const dailyRate = num(args, 'daily_rate', { min: 0, max: 100_000 }) ?? n0(worker.daily_rate)
    const travelAllowance = num(args, 'travel_allowance', { min: 0, max: 10_000 }) ?? 0
    const overtimeHours = num(args, 'overtime_hours', { min: 0, max: 200 }) ?? 0
    const overtimeRate = num(args, 'overtime_rate', { min: 0, max: 10_000 }) ?? 0
    const bonus = num(args, 'bonus', { min: 0, max: 1_000_000 }) ?? 0
    const uifApplied = bool(args, 'uif_applied') ?? true
    const paye = num(args, 'paye_deduction', { min: 0, max: 1_000_000 }) ?? 0
    const advance = num(args, 'advance_deduction', { min: 0, max: 1_000_000 }) ?? 0
    const toolDed = num(args, 'tool_deduction', { min: 0, max: 1_000_000 }) ?? 0
    const otherDed = num(args, 'other_deduction', { min: 0, max: 1_000_000 }) ?? 0
    const notes = str(args, 'deduction_notes', { max: 2000 })

    const basicPay = r2(dailyRate * (daysWorked - absentDays))
    const travelTotal = r2(travelAllowance * daysWorked)
    const ot = r2(overtimeHours * overtimeRate)
    const gross = r2(basicPay + travelTotal + ot + bonus)
    const uif = uifApplied ? r2(basicPay * 0.01) : 0
    const totalDeductions = r2(uif + paye + advance + toolDed + otherDed)
    const net = r2(gross - totalDeductions)

    const { data, error } = await sb
      .from('payslips')
      .insert({
        worker_id: workerId, period, period_start: periodStart, period_end: periodEnd, days_worked: daysWorked, absent_days: absentDays,
        daily_rate: dailyRate, travel_allowance: travelAllowance, overtime_hours: overtimeHours, overtime_rate: overtimeRate, bonus,
        uif_applied: uifApplied, paye_deduction: paye, advance_deduction: advance, tool_deduction: toolDed, other_deduction: otherDed,
        deduction_notes: notes ?? null, gross_pay: gross, total_deductions: totalDeductions, net_pay: net,
      })
      .select(PAYSLIP_COLS)
      .single()
    fail('Could not generate payslip', error)
    const bankReady = worker.bank_name && worker.account_number
    return ok(
      `Payslip for **${worker.name}** (${periodStart}${periodEnd ? ` → ${periodEnd}` : ''}): gross ${rand(gross)}, deductions ${rand(totalDeductions)}, **net ${rand(net)}**.${
        bankReady ? '' : ' ⚠️ No banking details on file for this worker yet.'
      } id \`${data.id}\``,
      { payslip: data, worker }
    )
  },

  async ngms_list_payslips(sb, args) {
    const { limit, offset } = pageFn(args)
    const workerId = uuid(args, 'worker_id', 'from ngms_list_workers', false)
    const from = date(args, 'from_date')
    const to = date(args, 'to_date')
    let q = sb.from('payslips').select(`${PAYSLIP_COLS}, workers(name)`, { count: 'exact' })
    if (workerId) q = q.eq('worker_id', workerId)
    if (from) q = q.gte('period_start', from)
    if (to) q = q.lte('period_start', to)
    const { data, error, count } = await q.order('period_start', { ascending: false }).range(offset, offset + limit - 1)
    fail('Database error', error)
    const rows = ((data ?? []) as unknown as (Payslip & { workers: { name: string } | null })[]).map(({ workers, ...p }) => ({ ...p, worker_name: workers?.name ?? null }))
    const info = pageInfoFn(count ?? rows.length, rows.length, offset)
    const totalNet = r2(rows.reduce((t, p) => t + n0(p.net_pay), 0))
    const text = rows.length
      ? `**${info.total} payslip(s)** · net total on this page: ${rand(totalNet)}${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` +
        rows.map((p) => `- ${p.period_start} · ${p.worker_name ?? '—'} · net ${rand(n0(p.net_pay))}\n  id: \`${p.id}\``).join('\n')
      : 'No payslips match.'
    return ok(text, { ...info, total_net_on_page: totalNet, payslips: rows })
  },

  async ngms_get_payslip(sb, args) {
    const id = uuid(args, 'payslip_id', 'from ngms_list_payslips')!
    const { data, error } = await sb.from('payslips').select(`${PAYSLIP_COLS}, workers(${WORKER_COLS})`).eq('id', id).maybeSingle()
    fail('Database error', error)
    if (!data) throw new ToolError(`No payslip with id ${id}.`)
    const { workers, ...payslip } = data as unknown as Payslip & { workers: Worker | null }
    return ok(`Payslip ${payslip.period_start} — net ${rand(n0(payslip.net_pay))}`, { payslip, worker: workers })
  },

  async ngms_delete_payslip(sb, args) {
    const id = uuid(args, 'payslip_id', 'from ngms_list_payslips')!
    const { data, error } = await sb.from('payslips').delete().eq('id', id).select('*')
    fail('Could not delete payslip', error)
    if (!data?.length) return ok('Nothing deleted — that payslip no longer exists.', { deleted: null })
    return ok(`Deleted payslip \`${data[0].id}\`.`, { deleted: data[0] })
  },

  // ---------------------------------------------------------- suppliers
  async ngms_list_suppliers(sb, args) {
    const { limit, offset } = pageFn(args)
    const search = str(args, 'search', { max: 100 })
    let q = sb.from('suppliers').select(SUPPLIER_COLS, { count: 'exact' })
    if (search) {
      const s = clean(search)
      q = q.or(`name.ilike.%${s}%,categories.ilike.%${s}%`)
    }
    const { data, error, count } = await q.order('name').range(offset, offset + limit - 1)
    fail('Database error', error)
    const rows = (data ?? []) as Supplier[]
    const info = pageInfoFn(count ?? rows.length, rows.length, offset)
    const text = rows.length
      ? `**${info.total} supplier(s)**${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` +
        rows.map((s) => `- **${s.name}**${s.categories ? ` · ${s.categories}` : ''} · ${s.phone ?? '—'}\n  id: \`${s.id}\``).join('\n')
      : 'No suppliers on file yet — add one with ngms_save_supplier.'
    return ok(text, { ...info, suppliers: rows })
  },

  async ngms_save_supplier(sb, args) {
    const id = uuid(args, 'supplier_id', 'from ngms_list_suppliers', false)
    const patch: Record<string, unknown> = {}
    for (const [k, max] of [['name', 120], ['contact_person', 120], ['phone', 30], ['email', 160], ['address', 300], ['categories', 200], ['notes', 2000]] as const) {
      const v = str(args, k, { max })
      if (v !== undefined) patch[k] = v
    }
    if (id) {
      if (!Object.keys(patch).length) throw new ToolError('Nothing to update.')
      const { data, error } = await sb.from('suppliers').update(patch).eq('id', id).select(SUPPLIER_COLS).maybeSingle()
      fail('Could not update supplier', error)
      if (!data) throw new ToolError(`No supplier with id ${id}.`)
      return ok(`Supplier updated: ${data.name}`, { supplier: data })
    }
    if (!patch.name) throw new ToolError("'name' is required for a new supplier.")
    const { data, error } = await sb.from('suppliers').insert(patch).select(SUPPLIER_COLS).single()
    fail('Could not add supplier', error)
    return ok(`Supplier added: ${data.name} · id \`${data.id}\``, { supplier: data })
  },

  // ---------------------------------------------------------- supplier purchases
  async ngms_list_supplier_purchases(sb, args) {
    const { limit, offset } = pageFn(args)
    const supplierId = uuid(args, 'supplier_id', 'from ngms_list_suppliers', false)
    const jobId = uuid(args, 'job_id', 'from ngms_list_jobs', false)
    const paymentStatus = oneOf(args, 'payment_status', PAYMENT_STATUSES)
    const from = date(args, 'from_date')
    const to = date(args, 'to_date')
    let q = sb.from('supplier_purchases').select(`${PURCHASE_COLS}, suppliers(name), jobs(title)`, { count: 'exact' })
    if (supplierId) q = q.eq('supplier_id', supplierId)
    if (jobId) q = q.eq('job_id', jobId)
    if (paymentStatus) q = q.eq('payment_status', paymentStatus)
    if (from) q = q.gte('purchase_date', from)
    if (to) q = q.lte('purchase_date', to)
    const { data, error, count } = await q.order('purchase_date', { ascending: false }).range(offset, offset + limit - 1)
    fail('Database error', error)
    const rows = ((data ?? []) as unknown as (SupplierPurchase & { suppliers: { name: string } | null; jobs: { title: string } | null })[]).map(({ suppliers, jobs, ...p }) => ({
      ...p,
      supplier_name: suppliers?.name ?? null,
      job_title: jobs?.title ?? null,
    }))
    const info = pageInfoFn(count ?? rows.length, rows.length, offset)
    const total = r2(rows.reduce((t, p) => t + n0(p.amount), 0))
    const text = rows.length
      ? `**${info.total} purchase(s)** · total on this page: ${rand(total)}${info.has_more ? ` — more from offset ${info.next_offset}` : ''}\n\n` +
        rows.map((p) => `- ${p.purchase_date} · ${p.description} · ${rand(n0(p.amount))} · ${p.supplier_name ?? '—'}${p.job_title ? ` → ${p.job_title}` : ''} · \`${p.payment_status}\`\n  id: \`${p.id}\``).join('\n')
      : 'No purchases logged yet — add one with ngms_save_supplier_purchase.'
    return ok(text, { ...info, total_on_page: total, purchases: rows })
  },

  async ngms_save_supplier_purchase(sb, args) {
    const id = uuid(args, 'purchase_id', 'from ngms_list_supplier_purchases', false)
    const supplierId = uuid(args, 'supplier_id', 'from ngms_list_suppliers', false) ?? null
    const jobId = uuid(args, 'job_id', 'from ngms_list_jobs', false) ?? null
    const description = str(args, 'description', { max: 300 })
    const category = oneOf(args, 'category', PURCHASE_CATEGORIES)
    const amount = num(args, 'amount', { min: 0, max: 100_000_000 })
    const purchaseDate = date(args, 'purchase_date')
    const receiptUrl = str(args, 'receipt_url', { max: 2000 })
    const paymentStatus = oneOf(args, 'payment_status', PAYMENT_STATUSES)
    const notes = str(args, 'notes', { max: 2000 })
    const logToJob = args.log_to_job === true

    if (id) {
      const patch: Record<string, unknown> = {}
      if (supplierId !== null) patch.supplier_id = supplierId
      if (jobId !== null) patch.job_id = jobId
      if (description !== undefined) patch.description = description
      if (category) patch.category = category
      if (amount !== undefined) patch.amount = r2(amount)
      if (purchaseDate) patch.purchase_date = purchaseDate
      if (receiptUrl !== undefined) patch.receipt_url = receiptUrl
      if (paymentStatus) patch.payment_status = paymentStatus
      if (notes !== undefined) patch.notes = notes
      if (!Object.keys(patch).length && !logToJob) throw new ToolError('Nothing to update.')
      const { data: cur, error: e0 } = await sb.from('supplier_purchases').select('*').eq('id', id).maybeSingle()
      fail('Database error', e0)
      if (!cur) throw new ToolError(`No purchase with id ${id}.`)
      const { data, error } = await sb.from('supplier_purchases').update(patch).eq('id', id).select('*').single()
      fail('Could not update purchase', error)
      let extra = ''
      if (logToJob && !cur.logged_to_job) extra = await logPurchaseToJob(sb, data as SupplierPurchase)
      return ok(`Purchase updated: ${data.description} · ${rand(n0(data.amount))}${extra}`, { purchase: data })
    }

    if (!description) throw new ToolError("'description' is required for a new purchase.")
    if (!category) throw new ToolError(`'category' is required: ${PURCHASE_CATEGORIES.join(', ')}.`)
    if (amount === undefined) throw new ToolError("'amount' is required.")
    const { data, error } = await sb
      .from('supplier_purchases')
      .insert({
        supplier_id: supplierId, job_id: jobId, description, category, amount: r2(amount),
        purchase_date: purchaseDate ?? todaySast(), receipt_url: receiptUrl ?? null, payment_status: paymentStatus ?? 'unpaid', notes: notes ?? null,
      })
      .select('*')
      .single()
    fail('Could not log purchase', error)
    let extra = ''
    if (logToJob && jobId) extra = await logPurchaseToJob(sb, data as SupplierPurchase)
    return ok(`Purchase logged: ${data.description} · ${rand(n0(data.amount))} · id \`${data.id}\`${extra}`, { purchase: data })
  },

  async ngms_delete_supplier_purchase(sb, args) {
    const id = uuid(args, 'purchase_id', 'from ngms_list_supplier_purchases')!
    const { data, error } = await sb.from('supplier_purchases').delete().eq('id', id).select('*')
    fail('Could not delete purchase', error)
    if (!data?.length) return ok('Nothing deleted — that purchase no longer exists.', { deleted: null })
    // Clean up the linked job_costs row too, if this purchase had been logged to a job.
    if (data[0].job_cost_id) await sb.from('job_costs').delete().eq('id', data[0].job_cost_id)
    return ok(`Deleted purchase \`${data[0].id}\`.`, { deleted: data[0] })
  },

  // ---------------------------------------------------------- job photos
  async ngms_list_job_photos(sb, args) {
    const jobId = uuid(args, 'job_id', 'from ngms_list_jobs')!
    const { data, error } = await sb.from('job_photos').select('*').eq('job_id', jobId).order('type').order('sort_order')
    fail('Could not load photos', error)
    const rows = data ?? []
    return ok(rows.length ? `${rows.length} photo(s) on file.` : 'No photos on this job yet.', { photos: rows })
  },

  async ngms_save_job_photo(sb, args) {
    const jobId = uuid(args, 'job_id', 'from ngms_list_jobs')!
    const { data: job } = await sb.from(`jobs`).select(JOB_COLS).eq('id', jobId).maybeSingle()
    if (!job) throw new ToolError(`No job with id ${jobId}.`)
    const photoUrl = str(args, 'photo_url', { required: true, max: 2000 })!
    const type = oneOf(args, 'type', PHOTO_TYPES) ?? 'progress'
    const caption = str(args, 'caption', { max: 300 })
    const sortOrder = num(args, 'sort_order', { min: 0, max: 10000 }) ?? 0
    const { data, error } = await sb.from('job_photos').insert({ job_id: jobId, photo_url: photoUrl, type, caption: caption ?? null, sort_order: sortOrder }).select('*').single()
    fail('Could not save photo', error)
    return ok(`Photo saved (${type}) for ${job.title ?? jobId}. id \`${data.id}\``, { photo: data })
  },

  async ngms_delete_job_photo(sb, args) {
    const id = uuid(args, 'photo_id', 'from ngms_list_job_photos')!
    const { data, error } = await sb.from('job_photos').delete().eq('id', id).select('*')
    fail('Could not delete photo', error)
    if (!data?.length) return ok('Nothing deleted — that photo no longer exists.', { deleted: null })
    return ok(`Deleted photo \`${data[0].id}\`.`, { deleted: data[0] })
  },
}

async function logPurchaseToJob(sb: SupabaseClient, p: SupplierPurchase): Promise<string> {
  if (!p.job_id) return ' (no job linked — nothing logged to job costing)'
  const { data: cost, error } = await sb
    .from('job_costs')
    .insert({ job_id: p.job_id, category: p.category, description: p.description, amount: p.amount })
    .select('id')
    .single()
  if (error) return ` (could not log to job costing: ${error.message})`
  await sb.from('supplier_purchases').update({ logged_to_job: true, job_cost_id: cost.id }).eq('id', p.id)
  return ' · logged to job costing.'
}
