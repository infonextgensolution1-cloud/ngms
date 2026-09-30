import type { SupabaseClient } from '@supabase/supabase-js'

// Deletes for the admin detail pages. Each one checks what still points at the
// record first, so a delete never leaves an invoice or job pointing at nothing,
// and throws a plain-English message the page can show as-is.
//
// Issued invoices are never deleted here: SARS expects them kept, and invoice
// numbers should run in sequence. Those get voided instead (existing Void button).

async function removeById(sb: SupabaseClient, table: string, id: string, what: string) {
  const { data, error } = await sb.from(table).delete().eq('id', id).select('id')
  if (error) throw new Error(`Could not delete ${what}: ${error.message}`)
  // RLS hides a refused delete as "0 rows", so check something actually went.
  if (!data?.length) throw new Error(`Could not delete ${what}. Sign in again and retry.`)
}

export async function deleteQuote(sb: SupabaseClient, id: string) {
  const [inv, jobs] = await Promise.all([
    sb.from('invoices').select('invoice_number').eq('quote_id', id),
    sb.from('jobs').select('title').eq('quote_id', id),
  ])
  if (inv.error || jobs.error) throw new Error('Could not check what is linked to this quote. Try again.')
  const linked = [
    ...(inv.data ?? []).map((i) => `invoice ${i.invoice_number}`),
    ...(jobs.data ?? []).map((j) => `job "${j.title ?? 'untitled'}"`),
  ]
  if (linked.length) throw new Error(`This quote is linked to ${linked.join(', ')}. Delete or void those first.`)
  await removeById(sb, 'quotes', id, 'the quote') // quote_items cascade
}

export async function deleteDraftInvoice(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from('invoices').select('status,paid_amount').eq('id', id).maybeSingle()
  if (error || !data) throw new Error('Could not load this invoice. Try again.')
  if (data.status !== 'draft' || Number(data.paid_amount ?? 0) > 0) {
    throw new Error('Only unsent draft invoices can be deleted. Void this one instead so it stays on record.')
  }
  await removeById(sb, 'invoices', id, 'the invoice') // invoice_items cascade
}

export async function deleteJob(sb: SupabaseClient, id: string) {
  // job_costs, labour_entries and job_photos cascade; supplier purchases are kept and unlinked.
  await removeById(sb, 'jobs', id, 'the job')
}

export async function deleteLead(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from('quotes').select('quote_number').eq('lead_id', id)
  if (error) throw new Error('Could not check for quotes made from this lead. Try again.')
  if (data?.length) {
    throw new Error(`Quote ${data.map((q) => q.quote_number).join(', ')} was made from this lead. Delete the quote first, or mark the lead as lost.`)
  }
  await removeById(sb, 'leads', id, 'the lead')
}
