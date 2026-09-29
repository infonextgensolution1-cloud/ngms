-- NOT applied to production. Review, then run in the Supabase SQL editor.
create table if not exists public.plan_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  suburb text,
  plan_name text not null,
  interval_months int not null check (interval_months between 1 and 12),
  next_reminder_date date not null,
  last_reminded_at timestamptz,
  consent_at timestamptz not null,
  unsubscribe_token text not null unique,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
-- RLS on with NO policies: only the server (service role) can read/write.
alter table public.plan_signups enable row level security;
create index if not exists plan_signups_due_idx on public.plan_signups (next_reminder_date) where unsubscribed_at is null;
