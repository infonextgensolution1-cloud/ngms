-- NGMS Sales Engine: post-job maintenance offers
create table if not exists public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source_job_id uuid references public.jobs(id) on delete set null,
  source_quote_id uuid references public.quotes(id) on delete set null,
  name text not null,
  service_scope text,
  frequency_months integer not null default 6 check (frequency_months between 1 and 36),
  discount_percent numeric not null default 0 check (discount_percent between 0 and 100),
  status text not null default 'offered' check (status in ('offered','active','paused','cancelled','declined')),
  next_due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maintenance_plans_client_idx on public.maintenance_plans(client_id);
create index if not exists maintenance_plans_due_idx on public.maintenance_plans(next_due_date);
create index if not exists maintenance_plans_status_idx on public.maintenance_plans(status);

alter table public.maintenance_plans enable row level security;

drop policy if exists "maintenance plans staff read" on public.maintenance_plans;
create policy "maintenance plans staff read"
on public.maintenance_plans
for select to authenticated
using (private.is_ngms_prompt_user());

comment on table public.maintenance_plans is
  'NGMS recurring maintenance offers and plans. Offered does not mean customer enrollment.';
