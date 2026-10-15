-- Permanent, client-linked document library for the NGMS customer portal.
-- Files remain in a private bucket; access is granted only by authenticated API routes.
begin;

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_id uuid null references public.quotes(id) on delete set null,
  title text not null check (char_length(title) between 1 and 180),
  category text not null default 'materials' check (category in ('materials','quotation','invoice','receipt','report','warranty','other')),
  original_filename text not null,
  storage_path text not null unique,
  content_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  location_label text not null default 'Gordon''s Bay',
  uploaded_by text null,
  created_at timestamptz not null default now(),
  is_visible_to_client boolean not null default true
);

create index if not exists client_documents_client_created_idx
  on public.client_documents(client_id, created_at desc);
create index if not exists client_documents_quote_idx
  on public.client_documents(quote_id) where quote_id is not null;

alter table public.client_documents enable row level security;
drop policy if exists client_documents_staff_all on public.client_documents;
create policy client_documents_staff_all on public.client_documents
  for all to authenticated
  using ((select private.is_ngms_prompt_user()))
  with check ((select private.is_ngms_prompt_user()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  15728640,
  array['application/pdf','image/jpeg','image/png','image/webp','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
