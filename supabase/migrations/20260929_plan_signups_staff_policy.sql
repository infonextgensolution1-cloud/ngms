-- Lets signed-in staff read/manage plan sign-ups in /admin/plans (same rule as leads/jobs).
drop policy if exists staff_all on public.plan_signups;
create policy staff_all on public.plan_signups for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
