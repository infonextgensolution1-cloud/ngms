-- NOT applied to production. Review, then run in the Supabase SQL editor.
-- Adds an unguessable token per job for the public /track/[token] page.
alter table public.jobs add column if not exists tracker_token text;
create unique index if not exists jobs_tracker_token_key on public.jobs (tracker_token) where tracker_token is not null;
