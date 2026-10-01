-- NGMS Supabase security hardening
-- Moves prompt authorization helpers out of exposed public schema,
-- restricts execution to authenticated staff, and pins trigger search paths.

create schema if not exists private;

create or replace function private.is_ngms_prompt_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.prompt_users pu
    where pu.user_id = auth.uid()
      and pu.active = true
      and pu.role = 'Admin'
  );
$$;

create or replace function private.is_ngms_prompt_user()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.prompt_users pu
    where pu.user_id = auth.uid()
      and pu.active = true
  );
$$;

revoke all on function private.is_ngms_prompt_admin() from public;
revoke all on function private.is_ngms_prompt_user() from public;
grant execute on function private.is_ngms_prompt_admin() to authenticated;
grant execute on function private.is_ngms_prompt_user() to authenticated;

drop policy if exists "prompt activity own read" on public.prompt_activity_logs;
drop policy if exists "prompt activity staff insert" on public.prompt_activity_logs;
drop policy if exists "prompt categories admin write" on public.prompt_categories;
drop policy if exists "prompt categories staff read" on public.prompt_categories;
drop policy if exists "prompt users admin write" on public.prompt_users;
drop policy if exists "prompt users self read" on public.prompt_users;
drop policy if exists "prompts admin write" on public.prompts;
drop policy if exists "prompts staff read" on public.prompts;

create policy "prompt activity own read" on public.prompt_activity_logs
for select to authenticated
using ((user_id = auth.uid()) or private.is_ngms_prompt_admin());

create policy "prompt activity staff insert" on public.prompt_activity_logs
for insert to authenticated
with check ((user_id = auth.uid()) and private.is_ngms_prompt_user());

create policy "prompt categories admin write" on public.prompt_categories
for all to authenticated
using (private.is_ngms_prompt_admin())
with check (private.is_ngms_prompt_admin());

create policy "prompt categories staff read" on public.prompt_categories
for select to authenticated
using (private.is_ngms_prompt_user());

create policy "prompt users admin write" on public.prompt_users
for all to authenticated
using (private.is_ngms_prompt_admin())
with check (private.is_ngms_prompt_admin());

create policy "prompt users self read" on public.prompt_users
for select to authenticated
using ((user_id = auth.uid()) or private.is_ngms_prompt_admin());

create policy "prompts admin write" on public.prompts
for all to authenticated
using (private.is_ngms_prompt_admin())
with check (private.is_ngms_prompt_admin());

create policy "prompts staff read" on public.prompts
for select to authenticated
using (private.is_ngms_prompt_user());

drop function if exists public.is_ngms_prompt_admin();
drop function if exists public.is_ngms_prompt_user();

alter function public.set_updated_at()
set search_path = pg_catalog, public;

alter function public.function_name()
set search_path = pg_catalog, public;

alter function public.touch_prompts_updated_at()
set search_path = pg_catalog, public;
