-- Structured subcontractor reports. Access is enforced by the server-side API against verified email + job assignment.
create table if not exists public.subcontractor_job_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  subcontractor_draft_id uuid not null references public.subcontractor_invitation_drafts(id) on delete restrict,
  report_type text not null check (report_type in ('inspection','during_work','completion')),
  work_summary text not null check (length(trim(work_summary)) between 1 and 5000),
  safety_notes text not null default '' check (length(safety_notes) <= 3000),
  issues_found text not null default '' check (length(issues_found) <= 3000),
  materials_used text not null default '' check (length(materials_used) <= 3000),
  next_steps text not null default '' check (length(next_steps) <= 3000),
  submitted_by_email text not null,
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('submitted','reviewed','requires_followup'))
);
alter table public.subcontractor_job_reports enable row level security;
revoke all on public.subcontractor_job_reports from anon, authenticated;
grant all on public.subcontractor_job_reports to service_role;
create index if not exists subcontractor_job_reports_job_id_submitted_at_idx
  on public.subcontractor_job_reports(job_id, submitted_at desc);
