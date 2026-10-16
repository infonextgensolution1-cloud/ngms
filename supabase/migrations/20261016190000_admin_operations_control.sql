-- NGMS Admin Operations Control: cross-device drafts, linked documents, and labour-only subcontractor settlements.
-- Apply only to the feature/preview database first. This migration is intentionally not applied to production.
create table if not exists public.admin_workspace_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  draft_key text not null,
  title text not null default '',
  payload jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, draft_key)
);
alter table public.admin_workspace_drafts enable row level security;
revoke all on public.admin_workspace_drafts from anon, authenticated;
grant all on public.admin_workspace_drafts to service_role;

create table if not exists public.job_documents (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  document_type text not null default 'other' check (document_type in ('invoice','supplier_receipt','materials_bulk_upload','quote','completion_report','contract','other')),
  linked_record_type text check (linked_record_type in ('job','quote','invoice','purchase','client','supplier','subcontractor')),
  linked_record_id uuid,
  original_filename text not null,
  storage_path text not null unique,
  content_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 20971520),
  review_status text not null default 'pending' check (review_status in ('pending','reviewed','approved','rejected')),
  notes text not null default '',
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.job_documents enable row level security;
revoke all on public.job_documents from anon, authenticated;
grant all on public.job_documents to service_role;
create index if not exists job_documents_job_created_idx on public.job_documents(job_id, created_at desc);
create index if not exists job_documents_linked_record_idx on public.job_documents(linked_record_type, linked_record_id);
create index if not exists job_documents_review_status_idx on public.job_documents(review_status, created_at desc);

create table if not exists public.subcontractor_labour_settlements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  subcontractor_draft_id uuid references public.subcontractor_invitation_drafts(id) on delete set null,
  labour_amount_ex_vat numeric(12,2) not null check (labour_amount_ex_vat >= 0),
  vat_rate numeric(5,4) not null default 0.00 check (vat_rate >= 0 and vat_rate <= 1),
  split_percent numeric(5,2) not null default 50 check (split_percent = 50),
  payable_ex_vat numeric(12,2) not null default 0,
  payable_inc_vat numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','pending_completion','payable','paid','void')),
  completion_marked_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id)
);
alter table public.subcontractor_labour_settlements enable row level security;
revoke all on public.subcontractor_labour_settlements from anon, authenticated;
grant all on public.subcontractor_labour_settlements to service_role;
create index if not exists subcontractor_labour_settlements_status_idx on public.subcontractor_labour_settlements(status, updated_at desc);

-- Completion automatically makes the approved 50% labour-only share payable.
-- This records a payable; it does NOT initiate a bank transfer or mark funds paid.
create or replace function public.ngms_mark_subcontractor_labour_payable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.subcontractor_labour_settlements
      set status = 'payable',
          payable_ex_vat = round(labour_amount_ex_vat * split_percent / 100, 2),
          payable_inc_vat = round((labour_amount_ex_vat * split_percent / 100) * (1 + vat_rate), 2),
          completion_marked_at = coalesce(completion_marked_at, now()),
          updated_at = now()
      where job_id = new.id and status in ('draft','pending_completion');
  end if;
  return new;
end;
$$;
drop trigger if exists ngms_job_completion_labour_payable on public.jobs;
create trigger ngms_job_completion_labour_payable
after update of status on public.jobs
for each row execute function public.ngms_mark_subcontractor_labour_payable();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ngms-job-documents', 'ngms-job-documents', false, 20971520,
  array['application/pdf','image/jpeg','image/png','image/webp','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel'])
on conflict (id) do nothing;
