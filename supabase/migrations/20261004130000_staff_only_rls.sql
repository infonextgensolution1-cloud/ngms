-- Staff-only access for internal tables.
--
-- Problem: these tables let ANY signed-in user read and write everything
-- ("auth.uid() IS NOT NULL" or "true"). Customer-portal users sign in too, so a
-- client could read every lead, worker, payslip and worker document.
--
-- Fix: the same staff check already used for clients/quotes/invoices/jobs —
-- private.is_ngms_prompt_user() (an active row in public.prompt_users).
-- Public read access (anon) is unchanged. Logged-in non-staff get exactly what
-- anonymous visitors get on public content (active slides, gallery, posts,
-- services), so the public site behaves the same whether or not you're logged in.
--
-- Server routes using the service-role key (WhatsApp webhook, plan reminders,
-- plan sign-up/unsubscribe, MCP) bypass RLS and are unaffected.
--
-- Reversible: recreate the old policies with "(select auth.uid()) is not null"
-- (or "true" for the three media tables).

begin;

-- 1. Internal tables: replace "any signed-in user" with staff only.
do $$
declare t text;
begin
  foreach t in array array[
    'job_costs', 'labour_entries', 'leads', 'materials', 'payslips', 'plan_signups',
    'posts', 'services', 'settings', 'supplier_purchases', 'suppliers',
    'worker_documents', 'workers'
  ] loop
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format(
      'create policy staff_all on public.%I for all to authenticated
         using ((select private.is_ngms_prompt_user()))
         with check ((select private.is_ngms_prompt_user()))', t);
  end loop;
end $$;

-- 2. Homepage/media tables: staff manage them; everyone reads the live ones.
drop policy if exists "Authenticated can read all hero slides" on public.hero_slides;
drop policy if exists "Authenticated can insert hero_slides" on public.hero_slides;
drop policy if exists "Authenticated can update hero_slides" on public.hero_slides;
drop policy if exists "Authenticated can delete hero_slides" on public.hero_slides;
create policy staff_all on public.hero_slides for all to authenticated
  using ((select private.is_ngms_prompt_user()))
  with check ((select private.is_ngms_prompt_user()));
create policy authenticated_read_active on public.hero_slides for select to authenticated
  using (is_active = true);

drop policy if exists "Authenticated can read all gallery photos" on public.gallery_photos;
drop policy if exists "Authenticated can insert gallery_photos" on public.gallery_photos;
drop policy if exists "Authenticated can update gallery_photos" on public.gallery_photos;
drop policy if exists "Authenticated can delete gallery_photos" on public.gallery_photos;
create policy staff_all on public.gallery_photos for all to authenticated
  using ((select private.is_ngms_prompt_user()))
  with check ((select private.is_ngms_prompt_user()));
create policy authenticated_read_active on public.gallery_photos for select to authenticated
  using (is_active = true);

-- before_after_photos already has a public (anon + authenticated) read of active rows.
drop policy if exists "Authenticated can insert before_after_photos" on public.before_after_photos;
drop policy if exists "Authenticated can update before_after_photos" on public.before_after_photos;
drop policy if exists "Authenticated can delete before_after_photos" on public.before_after_photos;
create policy staff_all on public.before_after_photos for all to authenticated
  using ((select private.is_ngms_prompt_user()))
  with check ((select private.is_ngms_prompt_user()));

-- 3. Public content that anon can read: give logged-in non-staff the same view.
create policy authenticated_read_published on public.posts for select to authenticated
  using (published = true);
create policy authenticated_read_active on public.services for select to authenticated
  using (is_active is true);
create policy authenticated_read on public.settings for select to authenticated
  using (true);

commit;
