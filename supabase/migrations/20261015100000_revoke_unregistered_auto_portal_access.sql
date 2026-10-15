-- Do not leave the initial access-control backfill granting permanent access
-- to every unregistered client record. Preserve registered customers and any
-- access that staff explicitly configured (updated_by is set by the admin API).
-- Revocation is reversible from Admin -> Clients -> Portal access.
update public.client_portal_access as a
set revoked_at = now(),
    updated_at = now()
from public.clients as c
where c.id = a.client_id
  and a.access_mode = 'permanent'
  and a.revoked_at is null
  and a.updated_by is null
  and not exists (
    select 1
    from auth.users as u
    where lower(coalesce(u.email, '')) = lower(coalesce(c.email, ''))
      and nullif(trim(c.email), '') is not null
  );
