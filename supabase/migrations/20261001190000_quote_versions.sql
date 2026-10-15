-- NGMS Sales Engine: immutable quote versions
-- Applies to existing quotes without changing current quote behaviour.

create table if not exists public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  version_number integer not null,
  version_status text not null default 'draft'
    check (version_status in ('draft','sent','accepted','declined','superseded')),
  revision_reason text,
  change_summary text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  created_by uuid,
  unique (quote_id, version_number)
);

create index if not exists quote_versions_quote_id_idx
  on public.quote_versions(quote_id);

create index if not exists quote_versions_status_idx
  on public.quote_versions(version_status);

comment on table public.quote_versions is
  'Immutable customer-facing quote versions. Never silently mutate a sent/accepted version.';

comment on column public.quote_versions.snapshot is
  'Self-contained JSON snapshot of quote header, client, line items, totals, terms and validity at this version.';

-- Seed one version for every existing quote. Existing rows become v1.
insert into public.quote_versions (
  quote_id, version_number, version_status, snapshot, created_at, sent_at, accepted_at
)
select
  q.id,
  1,
  case q.status
    when 'sent' then 'sent'
    when 'accepted' then 'accepted'
    when 'declined' then 'declined'
    when 'expired' then 'superseded'
    else 'draft'
  end,
  jsonb_build_object(
    'quote', to_jsonb(q),
    'source', 'migration',
    'version', 1
  ),
  q.created_at,
  case when q.status in ('sent','accepted','declined','expired') then q.updated_at else null end,
  case when q.status = 'accepted' then q.updated_at else null end
from public.quotes q
where not exists (
  select 1 from public.quote_versions v
  where v.quote_id = q.id
);

-- Prevent duplicate version numbers at the database level.
alter table public.quote_versions enable row level security;

-- Admin/service-role workflows can use the table. No public client access is granted here.
