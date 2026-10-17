-- NGMS finance/document automation foundation.
-- Additive schema only. Do not apply to production until review and preview tests pass.
-- Access is intended through authenticated server-side admin routes using the service role;
-- no browser/client role policies are added here. This is fail-closed by design.

create table if not exists public.ngms_document_records (
  id uuid primary key default gen_random_uuid(),
  document_number text unique,
  document_type text not null check (document_type in (
    'supplier_invoice','customer_invoice','quote','receipt','job_report',
    'completion_report','job_photo','purchase_order','delivery_note',
    'contract','tax_document','correspondence','other'
  )),
  title text not null check (char_length(title) between 1 and 240),
  issued_on date,
  customer_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.jobs(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_purchase_id uuid references public.supplier_purchases(id) on delete set null,
  storage_bucket text not null default 'ngms-admin-documents',
  storage_path text not null,
  original_filename text not null,
  content_type text,
  byte_size bigint check (byte_size is null or byte_size between 1 and 15728640),
  sha256 text,
  processing_status text not null default 'queued'
    check (processing_status in ('queued','processing','needs_review','complete','failed')),
  review_status text not null default 'pending'
    check (review_status in ('not_required','pending','approved','rejected')),
  is_visible_to_customer boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index if not exists ngms_document_records_customer_idx
  on public.ngms_document_records(customer_id, created_at desc);
create index if not exists ngms_document_records_project_idx
  on public.ngms_document_records(project_id, created_at desc);
create index if not exists ngms_document_records_supplier_idx
  on public.ngms_document_records(supplier_id, issued_on desc);
create index if not exists ngms_document_records_type_status_idx
  on public.ngms_document_records(document_type, processing_status, review_status);
create index if not exists ngms_document_records_invoice_idx
  on public.ngms_document_records(invoice_id) where invoice_id is not null;
create index if not exists ngms_document_records_quote_idx
  on public.ngms_document_records(quote_id) where quote_id is not null;

create table if not exists public.ngms_document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.ngms_document_records(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  provider text not null,
  status text not null default 'pending'
    check (status in ('pending','running','succeeded','needs_review','failed')),
  extracted_fields jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  validation_errors jsonb not null default '[]'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (document_id, attempt_number)
);

create index if not exists ngms_document_extractions_review_idx
  on public.ngms_document_extractions(status, created_at desc);

create table if not exists public.ngms_financial_posting_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.ngms_document_records(id) on delete restrict,
  transaction_type text not null check (transaction_type in (
    'supplier_invoice','expense','material_receipt','customer_payment','supplier_payment','adjustment'
  )),
  proposed_payload jsonb not null default '{}'::jsonb,
  amount numeric(14,2),
  currency char(3) not null default 'ZAR' check (currency = 'ZAR'),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','posted','reversed')),
  idempotency_key text not null unique,
  reviewed_by text,
  reviewed_at timestamptz,
  posted_at timestamptz,
  target_table text,
  target_id uuid,
  reversal_of uuid references public.ngms_financial_posting_reviews(id) on delete restrict,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status not in ('approved','posted','reversed') or reviewed_at is not null)
);

create index if not exists ngms_financial_posting_reviews_queue_idx
  on public.ngms_financial_posting_reviews(status, created_at);
create index if not exists ngms_financial_posting_reviews_document_idx
  on public.ngms_financial_posting_reviews(document_id);

create table if not exists public.ngms_material_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete restrict,
  project_id uuid references public.jobs(id) on delete set null,
  supplier_purchase_id uuid references public.supplier_purchases(id) on delete set null,
  document_id uuid references public.ngms_document_records(id) on delete set null,
  posting_review_id uuid references public.ngms_financial_posting_reviews(id) on delete restrict,
  movement_type text not null check (movement_type in ('receipt','issue','return','adjustment')),
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost numeric(14,2) check (unit_cost is null or unit_cost >= 0),
  movement_date date not null default current_date,
  notes text,
  created_by text,
  approved_by text,
  created_at timestamptz not null default now(),
  unique (posting_review_id, material_id, movement_type)
);

create index if not exists ngms_material_movements_material_date_idx
  on public.ngms_material_movements(material_id, movement_date desc);
create index if not exists ngms_material_movements_project_idx
  on public.ngms_material_movements(project_id, movement_date desc);

create table if not exists public.ngms_drive_sync_queue (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.ngms_document_records(id) on delete cascade,
  provider text not null default 'google_drive' check (provider = 'google_drive'),
  status text not null default 'pending'
    check (status in ('pending','syncing','synced','failed','skipped')),
  drive_file_id text,
  drive_folder_id text,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  last_attempt_at timestamptz,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, provider),
  unique (provider, drive_file_id)
);

create index if not exists ngms_drive_sync_queue_pending_idx
  on public.ngms_drive_sync_queue(status, created_at) where status in ('pending','failed');

create table if not exists public.ngms_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  request_id text,
  before_data jsonb,
  after_data jsonb,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ngms_audit_events_entity_idx
  on public.ngms_audit_events(entity_type, entity_id, created_at desc);
create index if not exists ngms_audit_events_created_idx
  on public.ngms_audit_events(created_at desc);

-- Private bucket used by server-side document APIs. Existing buckets are left unchanged.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ngms-admin-documents',
  'ngms-admin-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

-- Enable RLS with no client-role policies: direct browser access remains blocked.
-- Authenticated staff-only server routes use the service-role client after requireStaff checks.
alter table public.ngms_document_records enable row level security;
alter table public.ngms_document_extractions enable row level security;
alter table public.ngms_financial_posting_reviews enable row level security;
alter table public.ngms_material_movements enable row level security;
alter table public.ngms_drive_sync_queue enable row level security;
alter table public.ngms_audit_events enable row level security;
