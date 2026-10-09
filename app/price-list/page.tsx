import Link from 'next/link'

export const metadata = {
  alternates: { canonical: '/price-list' },
  title: 'Price List | NextGen Solar Clean & Maintenance Solutions',
  description:
    "Clear starting rates for solar cleaning, painting, waterproofing, paving and more across Strand, Gordon's Bay and Somerset West.",
}

type Row = { label: string; price: string; note?: string }
type Table = { title: string; index: string; intro: string; rows: Row[]; cols: [string, string, string?] }

const tables: Table[] = [
  {
    title: 'Solar Panel Cleaning',
    index: '01',
    intro: 'Careful cleaning for residential solar systems. Final pricing depends on access and panel count.',
    cols: ['System size', 'Starting price', 'Notes'],
    rows: [
      { label: 'Up to 10 panels', price: 'R550', note: 'Gentle soft wash' },
      { label: '11–20 panels', price: 'R950', note: 'Most common residential size' },
      { label: '21–30 panels', price: 'R1 350' },
      { label: '31–40 panels', price: 'R1 700' },
      { label: '41+ panels', price: 'R50 / panel', note: 'Volume pricing' },
      { label: 'Maintenance plan (every 4–6 months)', price: '15% off', note: 'Priority booking' },
    ],
  },
  {
    title: 'High-Pressure Cleaning',
    index: '02',
    intro: 'Restore outdoor surfaces with the right pressure and cleaning method for the material.',
    cols: ['Service', 'Starting price', 'Notes'],
    rows: [
      { label: 'Driveway / paving', price: 'R28 / m²', note: 'Light to medium soiling' },
      { label: 'Exterior walls', price: 'R25 / m²' },
      { label: 'Roof (soft wash preferred)', price: 'R32 / m²', note: 'Tile or metal' },
      { label: 'Boundary walls', price: 'R30 / m²', note: 'Both sides quoted separately' },
      { label: 'Full exterior package', price: 'R2 200', note: 'Typical single-storey' },
    ],
  },
  {
    title: 'Painting',
    index: '03',
    intro: 'Labour and standard materials. Surface preparation, access and final coating system affect the quote.',
    cols: ['Surface', 'Price per m²', 'Notes'],
    rows: [
      { label: 'Interior walls (2 coats)', price: 'R75–R110', note: 'Good condition, mid-range acrylic' },
      { label: 'Exterior walls (2 coats)', price: 'R85–R130', note: 'Coastal-grade paint recommended' },
      { label: 'Ceilings', price: 'R65–R95' },
      { label: 'Roof (metal / tile)', price: 'R55–R95', note: 'Includes wash & prep' },
      { label: 'Feature wall / feature colour', price: '+R25 / m²' },
    ],
  },
  {
    title: 'Waterproofing',
    index: '04',
    intro: 'System selection is based on the surface, water ingress, exposure and required preparation.',
    cols: ['System', 'Price per m²', 'Notes'],
    rows: [
      { label: 'Acrylic / liquid membrane', price: 'R180–R280', note: 'Balconies, parapets, light roofs' },
      { label: 'Torch-on bitumen (single layer)', price: 'R260–R380', note: 'Flat roofs' },
      { label: 'Torch-on (double layer)', price: 'R340–R480', note: 'High-exposure or long-life' },
      { label: 'Wall damp treatment', price: 'R120–R180', note: 'Rising / penetrating damp' },
      { label: 'Balcony full rebuild', price: 'R1 400 / m²', note: 'Tiles extra' },
    ],
  },
  {
    title: 'Other Core Services',
    index: '05',
    intro: 'Starting rates for common property maintenance jobs. Materials and job-specific requirements may be additional.',
    cols: ['Service', 'Starting price', 'Unit / notes'],
    rows: [
      { label: 'Gutter cleaning & flush', price: 'R650', note: 'Per house, single storey' },
      { label: 'Plumbing — basic call-out + 1 hour', price: 'R850', note: 'Labour only' },
      { label: 'Electrical — basic call-out + 1 hour', price: 'R950', note: 'COC extra if required' },
      { label: 'Pool fibre lining', price: 'R450 / m²', note: 'Includes surface prep' },
      { label: 'Paving (new)', price: 'R280 / m²', note: 'Supply + lay; stock subject to availability' },
      { label: 'Steelwork / welding', price: 'R650 / hour', note: 'Materials additional' },
      { label: 'Rubble removal', price: 'R1 800', note: 'Per bakkie load' },
      { label: 'Handyman hourly rate', price: 'R380 / hour', note: 'Minimum 2 hours' },
      { label: 'Crack repair', price: 'R65 / m' },
      { label: 'Old paint stripping', price: 'R80 / m²' },
    ],
  },
]

function PriceTable({ table }: { table: Table }) {
  return (
    <section id={`service-${table.index}`} className="scroll-mt-24 border-t border-[#C6C1B9] py-9 sm:py-12">
      <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#B83E00]">
            Rate card / {table.index}
          </p>
          <h2 className="mt-3 max-w-sm text-3xl font-semibold leading-[0.92] tracking-[-0.065em] text-[#171717] sm:text-4xl">
            {table.title}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#625F59]">{table.intro}</p>
        </div>
        <div className="min-w-0">
          <div className="overflow-x-auto border-y border-[#C6C1B9]">
            <table className="w-full min-w-[470px] border-collapse text-left text-sm">
              <thead>
                <tr className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#77736D]">
                  {table.cols.filter(Boolean).map((col) => (
                    <th key={col} className="px-3 py-3 font-medium first:pl-0">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => (
                  <tr key={row.label} className="border-t border-[#D5D1CA] align-top">
                    <td className="py-4 pr-3 pl-0 text-[#292825]">
                      <span className="mr-2 font-mono text-[9px] text-[#A09B92]">{String(index + 1).padStart(2, '0')}</span>
                      {row.label}
                    </td>
                    <td className="px-3 py-4 font-semibold tracking-[-0.025em] text-[#171717]">{row.price}</td>
                    <td className="px-3 py-4 text-xs leading-relaxed text-[#77736D]">{row.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function PriceListPage() {
  return (
    <main className="bg-[#F7F4EF] text-[#171717]">
      <section className="relative isolate mx-auto flex min-h-[500px] max-w-[1440px] flex-col overflow-hidden bg-[#171717] px-5 pb-7 pt-6 text-white sm:min-h-[570px] sm:px-10 sm:pt-8 lg:min-h-[620px] lg:px-16">
        <header className="flex items-center justify-between border-b border-white/20 pb-4 text-[10px] font-bold uppercase tracking-[0.16em] sm:text-xs">
          <Link href="/" aria-label="NextGen Maintenance Solutions home" className="text-base font-black tracking-[-0.08em] sm:text-lg">
            NGMS<span className="text-[#FF6A00]">.</span>
          </Link>
          <span className="hidden sm:inline text-white/55">One call. All solutions.</span>
          <Link href="/contact" className="transition-colors hover:text-[#FF6A00]">Contact ↗</Link>
        </header>

        <div className="relative flex flex-1 flex-col justify-center py-14 sm:py-16">
          <p className="mb-6 flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#C4C1BB] sm:text-[11px]">
            <span className="h-[2px] w-8 bg-[#FF6A00]" />
            NGMS / Transparent rates
          </p>
          <h1 className="max-w-[1000px] text-[clamp(4rem,11vw,10rem)] font-semibold leading-[0.78] tracking-[-0.085em] text-white">
            Clear
            <span className="block">scope.</span>
            <span className="block text-[#777570]">Clear rates.</span>
          </h1>
          <div className="mt-10 grid gap-7 border-t border-white/20 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-xl text-sm leading-relaxed text-[#C4C1BB] sm:text-base">
              Straightforward starting prices for property maintenance across Strand, Gordon’s Bay, Somerset West and the Helderberg Basin.
            </p>
            <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-[#96938D] sm:text-right">
              <p>01 / Starting rates</p>
              <p>02 / Free site assessment</p>
              <p>03 / Written quote before work</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/20 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#96938D]">
          <span>NextGen Maintenance Solutions</span>
          <a href="#rate-card" className="transition-colors hover:text-[#FF6A00]">Explore rates ↓</a>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute right-[-0.06em] top-[20%] select-none text-[clamp(10rem,26vw,25rem)] font-semibold leading-none tracking-[-0.12em] text-white/[0.025]">R</span>
      </section>

      <section id="rate-card" className="scroll-mt-16 bg-[#E5E2DD] px-5 py-10 sm:px-10 sm:py-14 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-7 border-b border-[#C6C1B9] pb-8 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#B83E00]">The rate card / 2026—27</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-6xl">Know the starting point.</h2>
            </div>
            <p className="max-w-xs font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-[#77736D]">
              All figures in ZAR / Scope confirmed on site
            </p>
          </div>

          <div className="my-7 grid gap-4 border border-[#C6C1B9] bg-[#F7F4EF] p-5 sm:grid-cols-3 sm:gap-6 sm:p-6">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#B83E00]">01 / Assessment</p>
              <p className="mt-2 text-sm leading-relaxed text-[#4F4C47]">Free site assessment and written quote, with no obligation.</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#B83E00]">02 / Local callout</p>
              <p className="mt-2 text-sm leading-relaxed text-[#4F4C47]">No callout fee in Strand, Gordon’s Bay or Somerset West.</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#B83E00]">03 / First booking</p>
              <p className="mt-2 text-sm leading-relaxed text-[#4F4C47]">10% off your first booking, excluding solar panel cleaning.</p>
            </div>
          </div>

          {tables.map((table) => <PriceTable key={table.index} table={table} />)}

          <div className="grid gap-8 border-t border-[#C6C1B9] py-9 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#B83E00]">Ready for an accurate quote?</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl">Let’s price your actual job.</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#625F59]">
                Rates are starting points for standard work in good condition. Final pricing depends on measurements, access, preparation and materials. Exterior work may be rescheduled if weather intervenes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="https://wa.me/27631387945?text=Hi%2C%20I%27d%20like%20a%20quote%20based%20on%20the%20price%20list" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-3 border border-[#FF6A00] bg-[#171717] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#303030]">
                <span aria-hidden="true" className="text-lg text-[#B7FF00]">◉</span> WhatsApp ↗
              </a>
              <Link href="/contact" className="inline-flex min-h-12 items-center gap-4 bg-[#FF6A00] px-5 py-3 text-sm font-bold text-[#171717] transition-colors hover:bg-[#E85E00]">
                Request a quote <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-[#C6C1B9] pt-5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-[#77736D]">
            <p>Prices exclude VAT where applicable. Materials and specialist requirements are confirmed in your written quote.</p>
            <p className="mt-2">Materials sourced through established suppliers, including Builders Warehouse. Payment terms are shown on the accepted quote.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
