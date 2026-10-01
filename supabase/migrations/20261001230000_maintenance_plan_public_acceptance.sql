alter table public.maintenance_plans
  add column if not exists public_token text;

create unique index if not exists maintenance_plans_public_token_uidx
  on public.maintenance_plans(public_token)
  where public_token is not null;

update public.maintenance_plans
set public_token = encode(gen_random_bytes(24), 'hex')
where public_token is null;

alter table public.maintenance_plans
  enable row level security;

drop policy if exists "Staff can read maintenance plans" on public.maintenance_plans;
create policy "Staff can read maintenance plans"
on public.maintenance_plans
for select
to authenticated
using ((select private.is_ngms_prompt_user()));

-- Public offer pages use the unguessable token through server-side admin access.
-- Customer activation remains an explicit action; an offered plan is not active by default.
