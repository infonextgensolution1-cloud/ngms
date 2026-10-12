-- Client portal access modes and private job-photo storage.
-- Existing client portal accounts are preserved as permanent until an admin changes them.
begin;

create table if not exists public.client_portal_access (
  client_id uuid primary key references public.clients(id) on delete cascade,
  access_mode text not null check (access_mode in ('one_time', 'temporary', 'permanent')),
  expires_at timestamptz,
  revoked_at timestamptz,
  one_time_session_id text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_portal_access_expiry_check check (
    (access_mode = 'temporary' and expires_at is not null)
    or (access_mode in ('one_time', 'permanent') and expires_at is null)
  )
);

alter table public.client_portal_access enable row level security;
revoke all on public.client_portal_access from anon, authenticated;
grant all on public.client_portal_access to service_role;

insert into public.client_portal_access (client_id, access_mode)
select id, 'permanent'
from public.clients
on conflict (client_id) do nothing;

create or replace function private.client_portal_access_allowed(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select exists (
    select 1
    from public.clients c
    join public.client_portal_access a on a.client_id = c.id
    where c.id = p_client_id
      and nullif((select auth.jwt() ->> 'email'), '') is not null
      and lower(coalesce(c.email, '')) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
      and a.revoked_at is null
      and (
        a.access_mode = 'permanent'
        or (a.access_mode = 'temporary' and a.expires_at > now())
        or (
          a.access_mode = 'one_time'
          and a.one_time_session_id is not null
          and a.one_time_session_id = (select auth.jwt() ->> 'session_id')
        )
      )
  );
$$;

revoke all on function private.client_portal_access_allowed(uuid) from public, anon;
grant execute on function private.client_portal_access_allowed(uuid) to authenticated;

drop policy if exists customer_read_own on public.clients;
create policy customer_read_own on public.clients for select to authenticated
  using (private.client_portal_access_allowed(id));

drop policy if exists customer_read_own on public.quotes;
create policy customer_read_own on public.quotes for select to authenticated
  using (exists (
    select 1 from public.clients c
    where c.id = quotes.client_id
      and private.client_portal_access_allowed(c.id)
  ));

drop policy if exists customer_read_own on public.quote_items;
create policy customer_read_own on public.quote_items for select to authenticated
  using (exists (
    select 1 from public.quotes q
    join public.clients c on c.id = q.client_id
    where q.id = quote_items.quote_id
      and private.client_portal_access_allowed(c.id)
  ));

drop policy if exists customer_read_own on public.invoices;
create policy customer_read_own on public.invoices for select to authenticated
  using (exists (
    select 1 from public.clients c
    where c.id = invoices.client_id
      and private.client_portal_access_allowed(c.id)
  ));

drop policy if exists customer_read_own on public.invoice_items;
create policy customer_read_own on public.invoice_items for select to authenticated
  using (exists (
    select 1 from public.invoices i
    join public.clients c on c.id = i.client_id
    where i.id = invoice_items.invoice_id
      and private.client_portal_access_allowed(c.id)
  ));

drop policy if exists customer_read_own on public.jobs;
create policy customer_read_own on public.jobs for select to authenticated
  using (exists (
    select 1 from public.clients c
    where c.id = jobs.client_id
      and private.client_portal_access_allowed(c.id)
  ));

drop policy if exists customer_read_own on public.job_photos;
create policy customer_read_own on public.job_photos for select to authenticated
  using (exists (
    select 1 from public.jobs j
    join public.clients c on c.id = j.client_id
    where j.id = job_photos.job_id
      and private.client_portal_access_allowed(c.id)
  ));