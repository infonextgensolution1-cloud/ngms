import type { Client, Item, Quote, Settings } from '@/lib/ngms-ops/core'

type Money = { subtotal: number; vat: number; total: number; deposit: number; deposit_percent: number; balance: number }

const esc = (v: unknown) => String(v ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '?')
const money = (n: number) => {
  const v = Math.round((Number(n) + Number.EPSILON) * 100) / 100
  const parts = Math.abs(v).toFixed(2).split('.')
  return (v < 0 ? '-' : '') + 'R' + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + parts[1]
}
const wrap = (text: string, max: number) => {
  const out: string[] = []
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const words = raw.split(/\s+/).filter(Boolean)
    if (!words.length) { out.push(''); continue }
    let line = ''
    for (const word of words) {
      const next = line ? line + ' ' + word : word
      if (next.length <= max) line = next
      else { if (line) out.push(line); line = word.slice(0, max) }
    }
    if (line) out.push(line)
  }
  return out
}
const textOp = (font: string, size: number, x: number, y: number, text: string) =>
  'BT /' + font + ' ' + size + ' Tf ' + x + ' ' + y + ' Td (' + esc(text) + ') Tj ET'
const lineOp = (x1: number, y1: number, x2: number, y2: number, colour: string, width = 1) => {
  const r = parseInt(colour.slice(0, 2), 16) / 255, g = parseInt(colour.slice(2, 4), 16) / 255, b = parseInt(colour.slice(4, 6), 16) / 255
  return r.toFixed(4) + ' ' + g.toFixed(4) + ' ' + b.toFixed(4) + ' RG ' + width + ' w ' + x1 + ' ' + y1 + ' m ' + x2 + ' ' + y2 + ' l S'
}
const rectOp = (x: number, y: number, w: number, h: number, fill: string) => {
  const r = parseInt(fill.slice(0, 2), 16) / 255, g = parseInt(fill.slice(2, 4), 16) / 255, b = parseInt(fill.slice(4, 6), 16) / 255
  return r.toFixed(4) + ' ' + g.toFixed(4) + ' ' + b.toFixed(4) + ' rg ' + x + ' ' + y + ' ' + w + ' ' + h + ' re f'
}

export function buildQuotePdf(input: {
  quote: Quote
  client: Client | null
  items: Item[]
  settings: Settings
  money: Money
  terms: string[]
  expired: boolean
}): Uint8Array {
  const q = input.quote, c = input.client, items = input.items, s = input.settings, m = input.money
  const pages: string[][] = [[]]
  let page = 0, y = 770
  const op = (v: string) => pages[page].push(v)
  const txt = (f: string, size: number, x: number, yy: number, v: string) => op(textOp(f, size, x, yy, v))
  const newPage = () => { pages.push([]); page++; y = 770 }
  const ensure = (h: number) => { if (y < 48 + h) newPage() }
  const row = (label: string, value: string, bold = false) => {
    ensure(16); txt(bold ? 'F2' : 'F1', bold ? 10.5 : 9.5, 390, y, label); txt(bold ? 'F2' : 'F1', bold ? 10.5 : 9.5, 515, y, value); y -= bold ? 18 : 14
  }

  // Premium NGMS print identity: charcoal header, Solar Orange accent, high-contrast type.
  op(rectOp(40, 704, 515, 80, '111111'))
  op(rectOp(40, 780, 515, 4, 'F57C1B'))
  op(rectOp(52, 731, 4, 29, 'F57C1B'))
  op('1 1 1 rg')
  txt('F2', 22, 64, 750, 'NEXTGEN')
  txt('F2', 8.5, 64, 734, 'ONE CALL. ALL SOLUTIONS.')
  txt('F2', 8.5, 355, 750, s.business_name || 'NextGen Maintenance Solutions')
  if (s.address) txt('F1', 8, 355, 737, s.address)
  if (s.phone) txt('F1', 8, 355, 725, s.phone)
  if (s.email) txt('F1', 8, 355, 713, s.email)
  op('0 0 0 rg')
  op(lineOp(40, 696, 555, 696, 'F57C1B', 1.2))
  txt('F2', 20, 40, 671, 'QUOTATION')
  txt('F1', 9, 40, 655, q.quote_number)
  txt('F1', 9, 410, 671, 'Date: ' + new Date(q.created_at).toLocaleDateString('en-ZA'))
  txt('F1', 9, 410, 657, 'Valid until: ' + (q.valid_until || '—'))
  txt('F2', 8, 410, 643, (input.expired ? 'EXPIRED' : q.status).toUpperCase())

  op(rectOp(40, 580, 515, 48, 'F5F5F4'))
  txt('F2', 8, 52, 612, 'QUOTED TO'); txt('F2', 11, 52, 596, c?.name || '—')
  if (c?.phone) txt('F1', 8.5, 52, 583, c.phone)
  if (c?.email) txt('F1', 8.5, 200, 583, c.email)
  if (c?.address || c?.suburb) txt('F1', 8.5, 52, 570, [c.address, c.suburb].filter(Boolean).join(', '))
  y = 540

  ensure(30); op(rectOp(40, y - 16, 515, 22, '0A0A0A'))
  txt('F2', 8, 48, y - 8, 'DESCRIPTION'); txt('F2', 8, 392, y - 8, 'QTY'); txt('F2', 8, 430, y - 8, 'UNIT'); txt('F2', 8, 478, y - 8, 'PRICE'); txt('F2', 8, 525, y - 8, 'AMOUNT'); y -= 30
  for (const it of items) {
    const desc = wrap(it.description || '', 52), h = Math.max(16, desc.length * 11)
    ensure(h + 4)
    desc.forEach((d, i) => txt('F1', 8.5, 48, y - i * 11, d))
    txt('F1', 8.5, 392, y, String(it.quantity)); txt('F1', 8.5, 430, y, it.unit || '')
    txt('F1', 8.5, 478, y, money(it.unit_price)); txt('F2', 8.5, 525, y, money(Number(it.quantity) * Number(it.unit_price)))
    y -= h + 6; op(lineOp(40, y + 4, 555, y + 4, 'E4E4E4', 0.4))
  }

  ensure(110); y -= 8; row('Subtotal', money(m.subtotal))
  if (q.vat_included) row('VAT', money(m.vat))
  else { txt('F1', 7.5, 390, y, 'Prices exclude VAT — not VAT registered.'); y -= 14 }
  op(lineOp(390, y + 4, 555, y + 4, 'F57C1B', 1.6)); row('TOTAL', money(m.total), true)
  row('Deposit (' + m.deposit_percent + '%)', money(m.deposit)); row('Balance on completion', money(m.balance))

  if (q.notes) { ensure(40); y -= 8; txt('F2', 8, 40, y, 'NOTES'); y -= 13; for (const l of wrap(q.notes, 105)) { ensure(12); txt('F1', 8.5, 40, y, l); y -= 11 } }
  ensure(70); y -= 8; txt('F2', 8, 40, y, 'TERMS'); y -= 13
  for (const t of input.terms) for (const l of wrap('• ' + t, 105)) { ensure(12); txt('F1', 7.5, 48, y, l); y -= 10 }
  ensure(55); y -= 8; txt('F2', 8, 40, y, 'BANKING DETAILS'); y -= 13
  for (const l of wrap(s.bank_details || 'Banking details to follow — please contact us before paying a deposit.', 105)) { ensure(12); txt(s.bank_details ? 'F1' : 'F2', 8, 40, y, l); y -= 11 }

  // Customer acceptance block for a clear written approval trail.
  ensure(82); y -= 7
  op(lineOp(40, y + 3, 555, y + 3, 'D6D3D1', 0.6))
  txt('F2', 8, 40, y - 12, 'CLIENT ACCEPTANCE')
  txt('F1', 7.5, 40, y - 25, 'I accept the scope, price and terms set out in this quotation.')
  const sigY = y - 52
  op(lineOp(40, sigY, 205, sigY, '777777', 0.6))
  op(lineOp(225, sigY, 390, sigY, '777777', 0.6))
  op(lineOp(410, sigY, 555, sigY, '777777', 0.6))
  txt('F1', 7, 40, sigY - 11, 'Client name / signature')
  txt('F1', 7, 225, sigY - 11, 'Signature')
  txt('F1', 7, 410, sigY - 11, 'Date')

  for (let i = 0; i < pages.length; i++) pages[i].push(textOp('F1', 7.5, 40, 28, (s.business_name || 'NextGen') + ' | Quote ' + q.quote_number + ' | Page ' + (i + 1) + ' of ' + pages.length))
  return makePdf(pages)
}

function makePdf(pageOps: string[][]): Uint8Array {
  // Build the PDF from ASCII-only strings and calculate every PDF offset/length
  // from encoded bytes. This matters because PDF xref offsets and stream
  // lengths are byte counts, not JavaScript character counts.
  const encoder = new TextEncoder()
  const objects: string[] = []
  const add = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const font1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const font2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  const pagesObj = add('')
  const pageIds: number[] = []

  for (const ops of pageOps) {
    const stream = ops.join('\n')
    const streamBytes = encoder.encode(stream)
    const contentId = add('<< /Length ' + streamBytes.byteLength + ' >>\nstream\n' + stream + '\nendstream')
    const pageId = add('')
    pageIds.push(pageId)
    objects[pageId - 1] =
      '<< /Type /Page /Parent ' + pagesObj +
      ' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ' +
      font1 + ' 0 R /F2 ' + font2 +
      ' 0 R >> >> /Contents ' + contentId + ' 0 R >>'
  }

  objects[pagesObj - 1] =
    '<< /Type /Pages /Kids [' + pageIds.map(id => id + ' 0 R').join(' ') +
    '] /Count ' + pageIds.length + ' >>'

  const catalog = add('<< /Type /Catalog /Pages ' + pagesObj + ' 0 R >>')

  const header = '%PDF-1.4\n%NGMS\n'
  const chunks: Uint8Array[] = [encoder.encode(header)]
  const offsets: number[] = [0]
  let offset = chunks[0].byteLength

  for (let i = 0; i < objects.length; i++) {
    const part = encoder.encode((i + 1) + ' 0 obj\n' + objects[i] + '\nendobj\n')
    offsets.push(offset)
    chunks.push(part)
    offset += part.byteLength
  }

  const xrefOffset = offset
  const xref = [
    'xref',
    '0 ' + (objects.length + 1),
    '0000000000 65535 f ',
    ...Array.from({ length: objects.length }, (_, i) =>
      String(offsets[i + 1]).padStart(10, '0') + ' 00000 n '
    ),
    'trailer',
    '<< /Size ' + (objects.length + 1) + ' /Root ' + catalog + ' 0 R >>',
    'startxref',
    String(xrefOffset),
    '%%EOF',
  ].join('\n') + '\n'

  chunks.push(encoder.encode(xref))

  const total = chunks.reduce((n, chunk) => n + chunk.byteLength, 0)
  const out = new Uint8Array(total)
  let cursor = 0
  for (const chunk of chunks) {
    out.set(chunk, cursor)
    cursor += chunk.byteLength
  }
  return out
}
