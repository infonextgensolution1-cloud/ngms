export const metadata = {
  title: 'Price List | NGSMS — NextGen Solar & Maintenance Solutions',
  description:
    'Clear starting rates for solar cleaning, painting, waterproofing, paving and more across Strand, Gordon\'s Bay and Somerset West.',
}

type Row = { label: string; price: string; note?: string }
type Table = { title: string; rows: Row[]; cols: [string, string, string?] }

const tables: Table[] = [
  {
    title: 'Solar Panel Cleaning',
    cols: ['System size', 'Price', 'Notes'],
    rows: [
      { label: 'Up to 10 panels', price: 'from R550', note: 'Soft brush + pure water' },
      { label: '11–20 panels', price: 'from R950', note: 'Most common residential size' },
      { label: '21–30 panels', price: 'from R1 350' },
      { label: '31–40 panels', price: 'from R1 700' },
      { label: '41+ panels', price: 'from R50/panel', note: 'Volume discount' },
      { label: 'Maintenance plan (every 4–6 months)', price: '15% off', note: 'Priority booking' },
    ],
  },
  {
    title: 'High-Pressure Cleaning',
    cols: ['Service', 'Price', 'Notes'],
    rows: [
      { label: 'Driveway / paving', price: 'from R28/m²', note: 'Light to medium soiling' },
      { label: 'Exterior walls', price: 'from R25/m²' },
      { label: 'Roof (soft wash preferred)', price: 'from R32/m²', note: 'Tile or metal' },
      { label: 'Boundary walls', price: 'from R30/m²', note: 'Both sides quoted separately' },
      { label: 'Full exterior package', price: 'from R2 200', note: 'Typical single-storey' },
    ],
  },
  {
    title: 'Painting (Labour + Standard Materials)',
    cols: ['Surface', 'Price per m²', 'Notes'],
    rows: [
      { label: 'Interior walls (2 coats)', price: 'R75 – R110', note: 'Good condition, mid-range acrylic' },
      { label: 'Exterior walls (2 coats)', price: 'R85 – R130', note: 'Coastal-grade paint recommended' },
      { label: 'Ceilings', price: 'R65 – R95' },
      { label: 'Roof (metal / tile)', price: 'R55 – R95', note: 'Includes wash & prep' },
      { label: 'Feature wall / feature colour', price: '+R25/m²' },
    ],
  },
  {
    title: 'Waterproofing',
    cols: ['System', 'Price per m²', 'Notes'],
    rows: [
      { label: 'Acrylic / liquid membrane', price: 'R180 – R280', note: 'Balconies, parapets, light roofs' },
      { label: 'Torch-on bitumen (single layer)', price: 'R260 – R380', note: 'Flat roofs' },
      { label: 'Torch-on (double layer)', price: 'R340 – R480', note: 'High-exposure or long-life' },
      { label: 'Wall damp treatment', price: 'R120 – R180', note: 'Rising damp / penetrating damp' },
      { label: 'Balcony full rebuild', price: 'from R1 400/m²', note: 'Tiles extra' },
    ],
  },
  {
    title: 'Other Core Services',
    cols: ['Service', 'Starting price', 'Unit'],
    rows: [
      { label: 'Gutter cleaning & flush', price: 'from R650', note: 'per house (single storey)' },
      { label: 'Plumbing — basic call-out + 1 hour', price: 'from R850', note: 'Labour only' },
      { label: 'Electrical — basic call-out + 1 hour', price: 'from R950', note: 'COC extra if required' },
      { label: 'Pool fibre lining', price: 'from R450/m²', note: 'Includes surface prep' },
      { label: 'Paving (new)', price: 'from R280/m²', note: 'Supply + lay (Builders Warehouse stock)' },
      { label: 'Steelwork / welding', price: 'from R650/hour', note: '+ materials' },
      { label: 'Rubble removal', price: 'from R1 800', note: 'per bakkie load' },
      { label: 'Handyman hourly rate', price: 'from R380/hour', note: 'Minimum 2 hours' },
      { label: 'Crack repair', price: 'from R65/m' },
      { label: 'Old paint stripping', price: 'from R80/m²' },
    ],
  },
]

function PriceTable({ table }: { table: Table }) {
  return (
    <div className="mb-10">
      <h2 className="font-heading text-xl font-semibold mb-3 text-paper">{table.title}</h2>
      <div className="overflow-x-auto rounded-card border border-darkgrey">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cardgrey text-left">
              {table.cols.filter(Boolean).map((c) => (
                <th key={c} className="px-4 py-2 font-heading font-semibold text-paper">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-graphite">
            {table.rows.map((r) => (
              <tr key={r.label} className="border-t border-darkgrey">
                <td className="px-4 py-2 text-mist">{r.label}</td>
                <td className="px-4 py-2 font-bold text-orange">{r.price}</td>
                <td className="px-4 py-2 text-mist opacity-70">{r.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PriceListPage() {
  return (
    <main className="bg-jet">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2 text-paper">Price List</h1>
        <p className="text-mist mb-1">Clear starting rates for Strand, Gordon's Bay &amp; Somerset West</p>
        <p className="text-sm text-mist opacity-70 mb-6">
          All prices exclude VAT · No callout fee in Strand, Gordon's Bay or Somerset West
        </p>

        <div className="bg-cardgrey border border-orange rounded-card p-4 mb-6 text-sm text-mist">
          <p>These are starting prices for standard residential work in good condition.</p>
          <p>Every job is measured and quoted properly after a free site assessment.</p>
          <p className="font-semibold mt-1 text-orange">10% off your first booking (excludes solar panel cleaning).</p>
        </div>

        <a
          href="https://wa.me/27631387945?text=Hi%2C%20I%27d%20like%20a%20quote%20based%20on%20the%20price%20list"
          className="flex items-center justify-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-6 py-3 rounded-btn mb-10"
        >
          WhatsApp us about a price
        </a>

        {tables.map((t) => (
          <PriceTable key={t.title} table={t} />
        ))}

        <div className="mt-10 pt-6 border-t border-darkgrey text-sm text-mist space-y-1 opacity-80">
          <p>• All prices exclude VAT (15%).</p>
          <p>• Free written quote after site visit — no obligation.</p>
          <p>• We use Builders Warehouse as primary supplier for materials.</p>
          <p>• Rain policy: exterior work is rescheduled at no cost if weather intervenes.</p>
          <p>• Payment: EFT, cash or card on completion.</p>
        </div>
      </div>
    </main>
  )
}
