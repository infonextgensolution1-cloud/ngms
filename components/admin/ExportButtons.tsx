'use client'

import { useState } from 'react'
import { Check, ClipboardCopy, FileSpreadsheet, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { fileStem, toTsv, type Table } from '@/lib/admin-export'
import type { SupabaseClient } from '@supabase/supabase-js'

/** "Excel" downloads an .xlsx of every record; "Google Sheets" copies them to paste into a sheet. */
export default function ExportButtons({ load }: { load: (sb: SupabaseClient) => Promise<Table> }) {
  const [busy, setBusy] = useState<'xlsx' | 'copy' | null>(null)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function excel() {
    setBusy('xlsx')
    setMsg('')
    try {
      const t = await load(supabase)
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const header = t.headers.map((h) => ({ value: h, fontWeight: 'bold' as const }))
      const body = t.rows.map((r) => r.map((v) => (v === null ? null : { value: v, type: typeof v === 'number' ? Number : String })))
      await writeXlsxFile([header, ...body], {
        sheet: t.title,
        stickyRowsCount: 1,
        columns: t.headers.map((h) => ({ width: Math.max(12, Math.min(40, h.length + 6)) })),
      }).toFile(`${fileStem(t)}.xlsx`)
      setMsg(`${t.rows.length} ${t.title.toLowerCase()} downloaded.`)
      setOk(true)
    } catch (e) {
      setMsg((e as Error).message)
      setOk(false)
    } finally {
      setBusy(null)
    }
  }

  async function sheets() {
    setBusy('copy')
    setMsg('')
    try {
      const t = await load(supabase)
      await navigator.clipboard.writeText(toTsv(t))
      setMsg(`${t.rows.length} ${t.title.toLowerCase()} copied. Open a Google Sheet, click cell A1 and paste.`)
      setOk(true)
    } catch (e) {
      setMsg((e as Error).message || 'Could not copy. Try the Excel download instead.')
      setOk(false)
    } finally {
      setBusy(null)
    }
  }

  const btn = 'inline-flex items-center gap-1.5 border border-darkgrey hover:border-blue text-mist hover:text-paper text-xs font-heading font-semibold px-3 py-1.5 rounded-btn disabled:opacity-50'

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-mist mr-1">Export all:</span>
        <button onClick={excel} disabled={!!busy} className={btn}>
          {busy === 'xlsx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} Excel
        </button>
        <button onClick={sheets} disabled={!!busy} className={btn}>
          {busy === 'copy' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCopy className="w-3.5 h-3.5" />} Google Sheets
        </button>
      </div>
      {msg && (
        <p className="text-xs text-mist mt-2 flex items-center gap-1.5">
          {ok && <Check className="w-3.5 h-3.5 text-whatsapp shrink-0" />} {msg}
        </p>
      )}
    </div>
  )
}
