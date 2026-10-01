-- Customer portal authorization hardening
-- Customers authenticate with Supabase email magic links and may read only
-- records whose client email matches their verified auth email.
-- Staff remain authorized through the existing private NGMS staff helper.

drop policy if exists staff_all on public.clients;
create policy staff_all on public.clients for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));
create policy customer_read_own on public.clients for select to authenticated
using (lower(coalesce(email,'')) = lower(coalesce((select auth.jwt()->>'email'),'')));

drop policy if exists staff_all on public.quotes;
create policy staff_all on public.quotes for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));
create policy customer_read_own on public.quotes for select to authenticated
using (exists (
  select 1 from public.clients c
  where c.id = quotes.client_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

drop policy if exists staff_all on public.quote_items;
create policy staff_all on public.quote_items for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));
create policy customer_read_own on public.quote_items for select to authenticated
using (exists (
  select 1 from public.quotes q
  join public.clients c on c.id = q.client_id
  where q.id = quote_items.quote_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

drop policy if exists staff_all on public.invoices;
create policy staff_all on public.invoices for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));
create policy customer_read_own on public.invoices for select to authenticated
using (exists (
  select 1 from public.clients c
  where c.id = invoices.client_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

drop policy if exists staff_all on public.invoice_items;
create policy staff_all on public.invoice_items for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));
create policy customer_read_own on public.invoice_items for select to authenticated
using (exists (
  select 1 from public.invoices i
  join public.clients c on c.id = i.client_id
  where i.id = invoice_items.invoice_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

drop policy if exists staff_all on public.jobs;
create policy staff_all on public.jobs for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));
create policy customer_read_own on public.jobs for select to authenticated
using (exists (
  select 1 from public.clients c
  where c.id = jobs.client_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));

drop policy if exists staff_all on public.job_photos;
create policy staff_all on public.job_photos for all to authenticated
using ((select private.is_ngms_prompt_user()))
with check ((select private.is_ngms_prompt_user()));
create policy customer_read_own on public.job_photos for select to authenticated
using (exists (
  select 1 from public.jobs j
  join public.clients c on c.id = j.client_id
  where j.id = job_photos.job_id
    and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
));
