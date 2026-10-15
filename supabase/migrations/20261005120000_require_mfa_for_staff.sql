-- Require two-step login (aal2) for staff database access.
--
-- Until now a password-only session counted as staff in every row-level-security
-- policy and storage policy, so two-step login only protected the admin screens.
-- private.is_ngms_prompt_user() is the single staff check behind all of them, so
-- adding the assurance-level test here covers every staff table and storage bucket.
--
-- After this: staff must be an active row in public.prompt_users AND have signed in
-- with their authenticator code (JWT claim aal = 'aal2').
--
-- Before running: every active staff member must have a verified authenticator, or
-- they lose data access until they set one up on /admin. Check with:
--   select p.user_id, p.full_name,
--     (select count(*) from auth.mfa_factors f
--       where f.user_id = p.user_id and f.factor_type = 'totp' and f.status = 'verified') as verified_totp
--   from public.prompt_users p where p.active;
-- (At the time of writing: one active staff user, with one verified authenticator.)
--
-- Locked out? Sign in at /admin (the dashboard still loads), set up the authenticator
-- again, and access returns. To revert, run this function without the aal2 line.

create or replace function private.is_ngms_prompt_user()
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $$
  select exists (
    select 1 from public.prompt_users pu
    where pu.user_id = auth.uid() and pu.active = true
  )
  and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;
