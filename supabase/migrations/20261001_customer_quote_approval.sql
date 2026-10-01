-- Customer quote approval
-- Customers can only update the status of their own sent quotes,
-- and only to accepted or declined.
drop policy if exists customer_update_sent_quote on public.quotes;
create policy customer_update_sent_quote on public.quotes
for update to authenticated
using (
  status = 'sent'
  and exists (
    select 1 from public.clients c
    where c.id = quotes.client_id
      and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
  )
)
with check (
  status in ('accepted','declined')
  and exists (
    select 1 from public.clients c
    where c.id = quotes.client_id
      and lower(coalesce(c.email,'')) = lower(coalesce((select auth.jwt()->>'email'),''))
  )
);
revoke update on public.quotes from authenticated;
grant update (status) on public.quotes to authenticated;
