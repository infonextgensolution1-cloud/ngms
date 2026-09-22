import { QUOTE_STATUSES, INVOICE_STATUSES, JOB_STATUSES, COST_CATEGORIES, INVOICE_KINDS, PAY_METHODS, DEFAULT_DEPOSIT_PERCENT, DEFAULT_DUE_DAYS } from './core'

// ================================================================ tool definitions

export const itemSchema = {
  type: 'object',
  properties: {
    description: { type: 'string', maxLength: 500, description: 'e.g. "Solar panel clean — 24 panels, purified water".' },
    quantity: { type: 'number', exclusiveMinimum: 0, default: 1 },
    unit: { type: 'string', maxLength: 20, description: 'm², panels, hours, item, bakkie load, etc. Default "item".' },
    unit_price: { type: 'number', description: 'Rand per unit, EXCLUDING VAT. Negative for discounts (e.g. NGX10 10% off).' },
    service_slug: { type: 'string', description: "Optional, e.g. 'solar-panel-cleaning' (see ngms_list_services on the Leads connector)." },
  },
  required: ['description', 'unit_price'],
  additionalProperties: false,
}
export const clientInput = {
  type: 'object',
  description: 'New client details (used only when client_id and lead_id are not given). An existing client with the same phone is reused.',
  properties: {
    name: { type: 'string', maxLength: 120 },
    phone: { type: 'string', maxLength: 30 },
    email: { type: 'string', maxLength: 160 },
    address: { type: 'string', maxLength: 300 },
    suburb: { type: 'string', maxLength: 80 },
  },
  required: ['name'],
  additionalProperties: false,
}
export const obj = { type: 'object', additionalProperties: true }
export const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
export const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
export const paging = {
  limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  offset: { type: 'integer', minimum: 0, default: 0 },
}
export const listOut = (key: string) => ({
  type: 'object',
  properties: { total: { type: 'integer' }, count: { type: 'integer' }, offset: { type: 'integer' }, has_more: { type: 'boolean' }, next_offset: { type: 'integer' }, [key]: { type: 'array', items: obj } },
  required: ['total', 'count', 'offset', 'has_more', key],
})

export const TOOLS = [
  // ---- business
  {
    name: 'ngms_get_business_settings',
    title: 'Business settings',
    description:
      'Business details used on quotes and invoices: name, contact numbers, email, address, VAT status/rate, quote validity and banking details. Always ask the owner to confirm the Capitec account number before putting banking details on a client document.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: obj,
    annotations: RO,
  },
  {
    name: 'ngms_business_summary',
    title: 'Business summary',
    description:
      'One-shot overview of the money side: quotes by status and value, quote win rate, quotes expiring soon, invoices outstanding and overdue (with who owes what), jobs by status, jobs booked for the next 14 days, and profit/margin on jobs completed in the window.',
    inputSchema: {
      type: 'object',
      properties: { since_days: { type: 'integer', minimum: 1, maximum: 730, default: 90, description: 'Window for quote stats and completed-job profit.' } },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: RO,
  },
  // ---- clients
  {
    name: 'ngms_list_clients',
    title: 'List clients',
    description: 'Find clients by name, phone, email or area, newest first. Returns client ids for quotes, invoices and jobs.',
    inputSchema: {
      type: 'object',
      properties: { search: { type: 'string', maxLength: 100 }, suburb: { type: 'string', maxLength: 80 }, ...paging },
      additionalProperties: false,
    },
    outputSchema: listOut('clients'),
    annotations: RO,
  },
  {
    name: 'ngms_save_client',
    title: 'Add or update client',
    description:
      'Create a client, or update one when client_id is given (only the fields you pass change). Creating with a phone number that already exists returns the existing client instead of a duplicate.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Omit to create a new client.' },
        name: { type: 'string', maxLength: 120, description: 'Person or complex, e.g. "Oceans Edge Body Corporate".' },
        phone: { type: 'string', maxLength: 30 },
        email: { type: 'string', maxLength: 160 },
        address: { type: 'string', maxLength: 300 },
        suburb: { type: 'string', maxLength: 80 },
        notes: { type: 'string', maxLength: 2000, description: 'Replaces the notes field (e.g. gate code, trustee contact, access rules).' },
      },
      additionalProperties: false,
    },
    outputSchema: { type: 'object', properties: { client: obj, created: { type: 'boolean' } }, required: ['client', 'created'] },
    annotations: WRITE,
  },
  // ---- quotes
  {
    name: 'ngms_list_quotes',
    title: 'List quotes',
    description: 'List quotes newest first, filtered by status, client, age or text (quote number / client name). Shows totals and flags sent quotes past their valid-until date.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: [...QUOTE_STATUSES] },
        open_only: { type: 'boolean', description: 'Only draft + sent quotes. Ignored when status is given.' },
        client_id: { type: 'string' },
        search: { type: 'string', maxLength: 100, description: 'Quote number (Q-0012) or part of the client name.' },
        since_days: { type: 'integer', minimum: 1, maximum: 730 },
        ...paging,
      },
      additionalProperties: false,
    },
    outputSchema: listOut('quotes'),
    annotations: RO,
  },
  {
    name: 'ngms_get_quote',
    title: 'Get quote',
    description: 'Full quote: client, line items, subtotal/VAT/total, deposit and balance, plus linked jobs and invoices. Accepts quote_id or quote_number.',
    inputSchema: {
      type: 'object',
      properties: { quote_id: { type: 'string' }, quote_number: { type: 'string', description: 'e.g. Q-0007' } },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: RO,
  },
  {
    name: 'ngms_create_quote',
    title: 'Create quote',
    description:
      'Create a quote (Q-####) with line items priced in Rand EXCLUDING VAT. Say who it is for with client_id, lead_id (reuses or creates the client and moves the lead to "quoted"), or client {name, phone, suburb}. ' +
      'Defaults: 70% deposit, validity from settings (30 days), no VAT while not VAT-registered, status draft. Warns if an Overberg job has no R350 callout line.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        lead_id: { type: 'string', description: 'Lead UUID from the NGSMS Leads connector.' },
        client: clientInput,
        items: { type: 'array', minItems: 1, maxItems: 100, items: itemSchema },
        deposit_percent: { type: 'number', minimum: 0, maximum: 100, default: DEFAULT_DEPOSIT_PERCENT },
        deposit_amount: { type: 'number', minimum: 0, description: 'Fixed Rand deposit instead of a percentage.' },
        valid_days: { type: 'integer', minimum: 1, maximum: 365, description: 'Default from settings (30).' },
        apply_vat: { type: 'boolean', description: 'Only allowed once VAT-registered. Default follows settings.' },
        status: { type: 'string', enum: ['draft', 'sent'], default: 'draft' },
        notes: { type: 'string', maxLength: 4000, description: 'Scope, exclusions, site notes, payment terms.' },
      },
      required: ['items'],
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  {
    name: 'ngms_update_quote',
    title: 'Update quote',
    description:
      'Change a quote: status (draft → sent → accepted / declined / expired), replace all line items, deposit, validity, VAT, notes. Accepted moves the linked lead to "won"; declined moves it to "lost". ' +
      'Line items can\'t be changed once an invoice exists for the quote. Deposit keeps the same % when items change unless you set a new one.',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        status: { type: 'string', enum: [...QUOTE_STATUSES] },
        items: { type: 'array', minItems: 1, maxItems: 100, items: itemSchema, description: 'Replaces ALL existing lines.' },
        deposit_percent: { type: 'number', minimum: 0, maximum: 100 },
        deposit_amount: { type: 'number', minimum: 0 },
        valid_until: { type: 'string', description: 'YYYY-MM-DD' },
        apply_vat: { type: 'boolean' },
        notes: { type: 'string', maxLength: 4000, description: 'Replaces the quote notes.' },
      },
      required: ['quote_id'],
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  // ---- invoices
  {
    name: 'ngms_list_invoices',
    title: 'List invoices',
    description: 'List invoices newest first with total, paid and balance. Filter by status, client, unpaid or overdue. Includes the total outstanding across the matches.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: [...INVOICE_STATUSES] },
        unpaid_only: { type: 'boolean', description: 'Anything not paid or void.' },
        overdue_only: { type: 'boolean', description: 'Unpaid and past the due date.' },
        client_id: { type: 'string' },
        search: { type: 'string', maxLength: 100, description: 'Invoice number (INV-0012) or part of the client name.' },
        ...paging,
      },
      additionalProperties: false,
    },
    outputSchema: listOut('invoices'),
    annotations: RO,
  },
  {
    name: 'ngms_get_invoice',
    title: 'Get invoice',
    description:
      'Full invoice: client, line items, VAT, total, paid, balance, due date, payment history (in notes) plus the business details and banking block for the PDF. Accepts invoice_id or invoice_number. Confirm the Capitec account number with the owner before sending.',
    inputSchema: {
      type: 'object',
      properties: { invoice_id: { type: 'string' }, invoice_number: { type: 'string', description: 'e.g. INV-0003' } },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: RO,
  },
  {
    name: 'ngms_create_invoice',
    title: 'Create invoice',
    description:
      'Create an invoice (INV-####). From a quote: kind "deposit" (deposit amount, due today), "balance" (full quote less deposit invoices already raised) or "full" (all quote lines). ' +
      'Or standalone: client_id / client + items. VAT follows the quote (or settings for standalone). Refuses a second deposit/balance/full invoice for the same quote unless allow_duplicate is true.',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        kind: { type: 'string', enum: [...INVOICE_KINDS], default: 'full', description: 'Only used with quote_id.' },
        client_id: { type: 'string', description: 'Standalone invoices only.' },
        client: clientInput,
        items: { type: 'array', minItems: 1, maxItems: 100, items: itemSchema, description: 'Standalone invoices only.' },
        apply_vat: { type: 'boolean', description: 'Standalone invoices only.' },
        due_days: { type: 'integer', minimum: 0, maximum: 120, description: `Days until due. Default ${DEFAULT_DUE_DAYS} (deposit invoices: 0).` },
        status: { type: 'string', enum: ['draft', 'sent'], default: 'draft' },
        notes: { type: 'string', maxLength: 4000 },
        allow_duplicate: { type: 'boolean', default: false },
      },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  {
    name: 'ngms_record_payment',
    title: 'Record payment',
    description: 'Record money received against an invoice. Updates paid amount, sets status to partial or paid, and logs the payment (date, method, reference) in the invoice notes. Refuses overpayments.',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        invoice_number: { type: 'string' },
        amount: { type: 'number', exclusiveMinimum: 0, description: 'Rand received.' },
        paid_on: { type: 'string', description: 'YYYY-MM-DD, default today (SAST).' },
        method: { type: 'string', enum: [...PAY_METHODS], default: 'eft' },
        reference: { type: 'string', maxLength: 120, description: 'Bank reference / proof of payment note.' },
      },
      required: ['amount'],
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  {
    name: 'ngms_update_invoice',
    title: 'Update invoice',
    description: 'Mark an invoice sent, back to draft, or void (only if nothing has been paid); change the due date; or add a note (appended with a SAST timestamp).',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        invoice_number: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'sent', 'void'] },
        due_date: { type: 'string', description: 'YYYY-MM-DD' },
        note: { type: 'string', maxLength: 2000 },
      },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  },
  // ---- jobs & costing
  {
    name: 'ngms_list_jobs',
    title: 'List jobs',
    description: 'List jobs by status, client or scheduled-date range (soonest first when a date range is given, else newest first).',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: [...JOB_STATUSES] },
        open_only: { type: 'boolean', description: 'scheduled, in_progress and on_hold only.' },
        client_id: { type: 'string' },
        from_date: { type: 'string', description: 'Scheduled on/after YYYY-MM-DD.' },
        to_date: { type: 'string', description: 'Scheduled on/before YYYY-MM-DD.' },
        ...paging,
      },
      additionalProperties: false,
    },
    outputSchema: listOut('jobs'),
    annotations: RO,
  },
  {
    name: 'ngms_get_job',
    title: 'Get job + costing',
    description: 'Full job card with client, linked quote, and job costing: every labour and cost entry, cost per category (Labour, Materials, Fuel, Overhead, Subcontractor), revenue ex VAT, gross profit and margin.',
    inputSchema: { type: 'object', properties: { job_id: { type: 'string' } }, required: ['job_id'], additionalProperties: false },
    outputSchema: obj,
    annotations: RO,
  },
  {
    name: 'ngms_create_job',
    title: 'Create job',
    description:
      'Book a job. From an accepted quote (quote_id — client, title and scope come from the quote; the quote is marked accepted if it was still draft/sent) or standalone with client_id / client + title. Warns about winter rain for painting, waterproofing and paving.',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        client_id: { type: 'string' },
        client: clientInput,
        title: { type: 'string', maxLength: 200, description: 'e.g. "Solar clean — 24 panels, Gordon\'s Bay".' },
        description: { type: 'string', maxLength: 4000, description: 'Scope, access, team, materials to collect.' },
        scheduled_date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  {
    name: 'ngms_update_job',
    title: 'Update job',
    description: 'Change job status (scheduled → in_progress → completed; on_hold for weather/access; cancelled), reschedule, rename, or add a timestamped site note. Completing sets completed_date to today unless given.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        status: { type: 'string', enum: [...JOB_STATUSES] },
        scheduled_date: { type: 'string' },
        completed_date: { type: 'string' },
        title: { type: 'string', maxLength: 200 },
        note: { type: 'string', maxLength: 2000, description: 'Appended to the job description with a SAST timestamp.' },
      },
      required: ['job_id'],
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  {
    name: 'ngms_log_labour',
    title: 'Log labour',
    description: 'Record hours worked on a job by a team member at an hourly rate (cost to the business). Use this for crew time; use ngms_add_job_cost for fuel, materials, overhead and subcontractors.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        employee_name: { type: 'string', maxLength: 120 },
        hours: { type: 'number', exclusiveMinimum: 0, maximum: 24 },
        rate_per_hour: { type: 'number', minimum: 0, description: 'Rand per hour paid to the worker.' },
        date: { type: 'string', description: 'YYYY-MM-DD, default today.' },
      },
      required: ['job_id', 'employee_name', 'hours', 'rate_per_hour'],
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  {
    name: 'ngms_add_job_cost',
    title: 'Add job cost',
    description:
      'Record a cost against a job: Materials, Fuel, Overhead, Subcontractor, or a lump-sum Labour payment (day rate). Give amount, or quantity × unit_price. Link a tracked material with material_id; set update_material_price to also refresh its last price.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        category: { type: 'string', enum: [...COST_CATEGORIES] },
        description: { type: 'string', maxLength: 300, description: 'e.g. "Plascon Wall & All 20L x3 — Builders Somerset West".' },
        amount: { type: 'number', minimum: 0, description: 'Total Rand actually paid.' },
        quantity: { type: 'number', exclusiveMinimum: 0 },
        unit_price: { type: 'number', minimum: 0 },
        material_id: { type: 'string' },
        update_material_price: { type: 'boolean', default: false },
      },
      required: ['job_id', 'category'],
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
  {
    name: 'ngms_delete_job_cost',
    title: 'Delete cost or labour entry',
    description: 'Remove a wrongly captured cost or labour entry (ids shown by ngms_get_job). Cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: { cost_id: { type: 'string' }, labour_entry_id: { type: 'string' } },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  // ---- materials
  {
    name: 'ngms_list_materials',
    title: 'List materials',
    description: 'Tracked material prices (Builders Warehouse by default) with last price and date checked — for pricing quotes and costing jobs.',
    inputSchema: {
      type: 'object',
      properties: { search: { type: 'string', maxLength: 100 }, supplier: { type: 'string', maxLength: 80 }, ...paging },
      additionalProperties: false,
    },
    outputSchema: listOut('materials'),
    annotations: RO,
  },
  {
    name: 'ngms_save_material',
    title: 'Add or update material',
    description: 'Add a material to the price list, or update its price (pass material_id). last_checked defaults to today.',
    inputSchema: {
      type: 'object',
      properties: {
        material_id: { type: 'string' },
        description: { type: 'string', maxLength: 300 },
        supplier: { type: 'string', maxLength: 80, default: 'Builders Warehouse' },
        sku: { type: 'string', maxLength: 60 },
        unit: { type: 'string', maxLength: 30, description: 'e.g. 20L, bag, m², each' },
        last_price: { type: 'number', minimum: 0, description: 'Rand, as paid (incl. the supplier\'s VAT).' },
        last_checked: { type: 'string', description: 'YYYY-MM-DD' },
      },
      additionalProperties: false,
    },
    outputSchema: obj,
    annotations: WRITE,
  },
] as const
