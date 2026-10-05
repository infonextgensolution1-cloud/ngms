-- Lead follow-up reminders: an optional date on each lead.
--
-- Run this BEFORE deploying the code that reads it: the admin Leads pages select
-- follow_up_at, so they would error until the column exists. Adding a nullable
-- column is harmless to the code that is live now.
--
-- Row-level security is unchanged: leads stays staff-only (staff_all policy).
-- Reverse with: alter table public.leads drop column follow_up_at;

alter table public.leads add column if not exists follow_up_at date;

create index if not exists leads_follow_up_at_idx
  on public.leads (follow_up_at)
  where follow_up_at is not null;
