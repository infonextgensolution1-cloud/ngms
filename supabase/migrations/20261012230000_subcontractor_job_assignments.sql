-- Persist staff-managed subcontractor assignments. Drafts are not portal accounts.
create table if not exists public.job_subcontractor_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  subcontractor_draft_id uuid not null references public.subcontractor_invitation_drafts(id) on delete restrict,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id)
);

alter table public.job_subcontractor_assignments enable row level security;
revoke all on public.job_subcontractor_assignments from anon, authenticated;
grant all on public.job_subcontractor_assignments to service_role;

create index if not exists job_subcontractor_assignments_job_id_idx
  on public.job_subcontractor_assignments(job_id);
create index if not exists job_subcontractor_assignments_subcontractor_idx
  on public.job_subcontractor_assignments(subcontractor_draft_id);
