-- Draft-only subcontractor invitations. This migration does not create auth users or send email.
create table if not exists public.subcontractor_invitation_drafts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (length(trim(company_name)) between 1 and 160),
  contact_name text not null check (length(trim(contact_name)) between 1 and 160),
  email text not null check (email = lower(trim(email))),
  notes text not null default '',
  permissions jsonb not null default '{"quotes_read":true,"invoices_read":true,"assigned_jobs_only":true,"submit_inspection_reports":true,"submit_completion_reports":true,"upload_job_photos":true,"quotes_edit":false,"invoices_edit":false}'::jsonb,
  status text not null default 'draft' check (status = 'draft'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subcontractor_invitation_drafts enable row level security;
revoke all on public.subcontractor_invitation_drafts from anon, authenticated;
grant all on public.subcontractor_invitation_drafts to service_role;

create index if not exists subcontractor_invitation_drafts_updated_at_idx
  on public.subcontractor_invitation_drafts (updated_at desc);
