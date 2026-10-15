-- NGMS client completion, final-payment and retention workflow foundation
alter table public.settings
  add column if not exists google_review_url text,
  add column if not exists facebook_review_url text,
  add column if not exists retention_cadence jsonb not null default '{"enabled":true,"steps":[{"key":"satisfaction","delay_days":2,"channel":"whatsapp"},{"key":"review","delay_days":7,"channel":"whatsapp"},{"key":"relationship","delay_days":30,"channel":"email"}]}'::jsonb;

alter table public.clients
  add column if not exists preferred_channel text not null default 'both',
  add column if not exists marketing_opt_in boolean not null default false;

create table if not exists public.job_completion_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  final_invoice_id uuid references public.invoices(id) on delete set null,
  completed_at timestamptz not null default now(),
  work_completed text,
  completion_notes text,
  outstanding_issues text,
  warranty_notes text,
  client_satisfaction text,
  report_pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  google_review_url text,
  facebook_review_url text,
  status text not null default 'requested' check (status in ('requested','received','declined','closed')),
  rating integer check (rating is null or rating between 1 and 5),
  review_text text,
  source text check (source is null or source in ('google','facebook','other')),
  response_draft text,
  response_status text not null default 'not_started' check (response_status in ('not_started','drafted','approved','sent')),
  response_sent_at timestamptz,
  requested_at timestamptz not null default now(),
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  followup_type text not null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp','email','both','portal')),
  scheduled_for date not null,
  status text not null default 'scheduled' check (status in ('scheduled','sent','completed','skipped','cancelled')),
  subject text,
  message text,
  notes text,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_completion_reports_job_idx on public.job_completion_reports(job_id);
create index if not exists review_requests_client_idx on public.review_requests(client_id);
create index if not exists review_requests_job_idx on public.review_requests(job_id);
create index if not exists client_followups_client_date_idx on public.client_followups(client_id, scheduled_for);
create index if not exists client_followups_due_idx on public.client_followups(status, scheduled_for);

alter table public.job_completion_reports enable row level security;
alter table public.review_requests enable row level security;
alter table public.client_followups enable row level security;

drop policy if exists staff_all on public.job_completion_reports;
create policy staff_all on public.job_completion_reports for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));

drop policy if exists customer_read_own on public.job_completion_reports;
create policy customer_read_own on public.job_completion_reports for select to authenticated
using (exists (
  select 1 from public.jobs j
  join public.clients c on c.id = j.client_id
  where j.id = job_completion_reports.job_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

drop policy if exists staff_all on public.review_requests;
create policy staff_all on public.review_requests for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));

drop policy if exists customer_read_own on public.review_requests;
create policy customer_read_own on public.review_requests for select to authenticated
using (exists (
  select 1 from public.clients c
  where c.id = review_requests.client_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

drop policy if exists staff_all on public.client_followups;
create policy staff_all on public.client_followups for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));

drop policy if exists customer_read_own on public.client_followups;
create policy customer_read_own on public.client_followups for select to authenticated
using (exists (
  select 1 from public.clients c
  where c.id = client_followups.client_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

-- This migration establishes the data foundation for:
-- deposit received -> job completion -> final balance -> completion report -> review -> retention.
