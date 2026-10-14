-- NGMS credit-note records and review-gated issuance.
-- This migration is intentionally additive. It does not alter invoices, paid_amount,
-- payment history, or customer balances.
begin;

create sequence if not exists public.credit_note_number_seq;

create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  credit_note_number text not null unique
    default ('CN-' || lpad(nextval('public.credit_note_number_seq')::text, 6, '0')),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'void')),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'manual_review_required', 'approved', 'rejected')),
  reason text not null check (length(btrim(reason)) > 0),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  vat_amount numeric(12,2) not null default 0 check (vat_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  issued_by uuid references auth.users(id) on delete set null,
  issued_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  constraint credit_note_total_matches_parts check (total_amount = subtotal + vat_amount)
);

create table if not exists public.credit_note_items (
  id uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references public.credit_notes(id) on delete restrict,
  description text not null check (length(btrim(description)) > 0),
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'item',
  unit_price numeric(12,2) not null check (unit_price >= 0),
  vat_rate numeric(5,2) not null default 0 check (vat_rate >= 0 and vat_rate <= 100),
  line_subtotal numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now()
);

create index if not exists credit_notes_invoice_id_idx on public.credit_notes(invoice_id);
create index if not exists credit_notes_client_id_idx on public.credit_notes(client_id);
create index if not exists credit_note_items_note_id_idx on public.credit_note_items(credit_note_id);
-- Serialize line edits against issuance by locking the parent credit-note row.
create or replace function public.ngms_guard_credit_note_item_edit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $
declare v_note_id uuid; v_status text;
begin
  if tg_op = 'UPDATE' and new.credit_note_id is distinct from old.credit_note_id then
    raise exception 'A credit-note line cannot be moved to another credit note.';
  end if;
  if tg_op = 'DELETE' then v_note_id := old.credit_note_id; else v_note_id := new.credit_note_id; end if;
  select status into v_status from public.credit_notes where id = v_note_id for update;
  if not found then raise exception 'Credit note not found.'; end if;
  if v_status <> 'draft' then raise exception 'Only draft credit-note lines can be changed.'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $;
revoke all on function public.ngms_guard_credit_note_item_edit() from public, anon, authenticated;
drop trigger if exists credit_note_items_guard_draft on public.credit_note_items;
create trigger credit_note_items_guard_draft before insert or update or delete on public.credit_note_items
for each row execute function public.ngms_guard_credit_note_item_edit();

alter table public.credit_notes enable row level security;
alter table public.credit_note_items enable row level security;

drop policy if exists credit_notes_staff_select on public.credit_notes;
create policy credit_notes_staff_select on public.credit_notes
  for select to authenticated using ((select private.is_ngms_prompt_user()));

drop policy if exists credit_notes_staff_insert_draft on public.credit_notes;
create policy credit_notes_staff_insert_draft on public.credit_notes
  for insert to authenticated
  with check (
    (select private.is_ngms_prompt_user())
    and status = 'draft'
    and review_status = 'pending'
    and created_by = auth.uid()
  );

drop policy if exists credit_notes_staff_update_draft on public.credit_notes;
create policy credit_notes_staff_update_draft on public.credit_notes
  for update to authenticated
  using ((select private.is_ngms_prompt_user()) and status = 'draft')
  with check (
    (select private.is_ngms_prompt_user())
    and status = 'draft'
    and review_status in ('pending', 'manual_review_required', 'rejected')
  );

drop policy if exists credit_notes_staff_delete_draft on public.credit_notes;
create policy credit_notes_staff_delete_draft on public.credit_notes
  for delete to authenticated
  using ((select private.is_ngms_prompt_user()) and status = 'draft');

drop policy if exists credit_note_items_staff_select on public.credit_note_items;
create policy credit_note_items_staff_select on public.credit_note_items
  for select to authenticated using ((select private.is_ngms_prompt_user()));

drop policy if exists credit_note_items_staff_insert_draft on public.credit_note_items;
create policy credit_note_items_staff_insert_draft on public.credit_note_items
  for insert to authenticated
  with check (
    (select private.is_ngms_prompt_user())
    and exists (
      select 1 from public.credit_notes cn
      where cn.id = credit_note_id and cn.status = 'draft'
    )
  );

drop policy if exists credit_note_items_staff_update_draft on public.credit_note_items;
create policy credit_note_items_staff_update_draft on public.credit_note_items
  for update to authenticated
  using (
    (select private.is_ngms_prompt_user())
    and exists (select 1 from public.credit_notes cn where cn.id = credit_note_id and cn.status = 'draft')
  )
  with check (
    (select private.is_ngms_prompt_user())
    and exists (select 1 from public.credit_notes cn where cn.id = credit_note_id and cn.status = 'draft')
  );

drop policy if exists credit_note_items_staff_delete_draft on public.credit_note_items;
create policy credit_note_items_staff_delete_draft on public.credit_note_items
  for delete to authenticated
  using (
    (select private.is_ngms_prompt_user())
    and exists (select 1 from public.credit_notes cn where cn.id = credit_note_id and cn.status = 'draft')
  );

-- Separate review step. Paid and partially-paid source invoices cannot be approved
-- by this generic RPC: they must be reviewed manually and documented by an Admin.
create or replace function public.ngms_review_credit_note(
  p_credit_note_id uuid,
  p_decision text,
  p_review_note text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_note public.credit_notes%rowtype;
  v_invoice public.invoices%rowtype;
begin
  if auth.uid() is null or not private.is_ngms_prompt_user() then
    raise exception 'Staff only.' using errcode = '42501';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'Decision must be approve or reject.';
  end if;
  if length(btrim(coalesce(p_review_note, ''))) < 8 then
    raise exception 'A review note of at least 8 characters is required.';
  end if;

  select * into v_note from public.credit_notes where id = p_credit_note_id for update;
  if not found then raise exception 'Credit note not found.'; end if;
  if v_note.status <> 'draft' then raise exception 'Only draft credit notes can be reviewed.'; end if;

  select * into v_invoice from public.invoices where id = v_note.invoice_id for update;
  if not found then raise exception 'Source invoice not found.'; end if;
  if v_invoice.client_id is distinct from v_note.client_id then
    raise exception 'Credit note client must match the source invoice client.';
  end if;
  if v_invoice.status = 'void' then raise exception 'A void invoice cannot be credited.'; end if;

  -- Paid and partially-paid source invoices require an explicit Admin decision.
  -- A non-admin cannot approve them through the generic staff workflow.
  if v_invoice.status in ('paid', 'partial') then
    if p_decision = 'approve' and private.is_ngms_prompt_admin() then
      update public.credit_notes
        set review_status = 'approved',
            reviewed_by = auth.uid(), reviewed_at = now(), review_note = btrim(p_review_note)
        where id = p_credit_note_id;
      return jsonb_build_object(
        'ok', true,
        'review_status', 'approved',
        'manual_review_completed', true,
        'message', 'Admin review recorded. Issuance remains a separate action; invoice balance and payment history are unchanged.'
      );
    end if;

    update public.credit_notes
      set review_status = case when p_decision = 'reject' then 'rejected' else 'manual_review_required' end,
          reviewed_by = auth.uid(), reviewed_at = now(), review_note = btrim(p_review_note)
      where id = p_credit_note_id;
    return jsonb_build_object(
      'ok', false,
      'manual_review_required', true,
      'message', 'Paid and partially-paid invoices require explicit Admin accounting review. No invoice balance or payment history was changed.'
    );
  end if;

  update public.credit_notes
    set review_status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(), reviewed_at = now(), review_note = btrim(p_review_note)
    where id = p_credit_note_id;

  return jsonb_build_object('ok', true, 'review_status', case when p_decision = 'approve' then 'approved' else 'rejected' end);
end;
$$;

revoke all on function public.ngms_review_credit_note(uuid, text, text) from public, anon;
grant execute on function public.ngms_review_credit_note(uuid, text, text) to authenticated;

-- Issuance is a distinct staff RPC. It is intentionally accounting-neutral: it
-- creates an issued credit document but never edits the invoice's payment fields.
create or replace function public.ngms_issue_credit_note(p_credit_note_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_note public.credit_notes%rowtype;
  v_invoice public.invoices%rowtype;
  v_items_subtotal numeric(12,2);
  v_previous_credits numeric(12,2);
begin
  if auth.uid() is null or not private.is_ngms_prompt_user() then
    raise exception 'Staff only.' using errcode = '42501';
  end if;

  select * into v_note from public.credit_notes where id = p_credit_note_id for update;
  if not found then raise exception 'Credit note not found.'; end if;
  if v_note.status <> 'draft' then raise exception 'Only draft credit notes can be issued.'; end if;
  if v_note.review_status <> 'approved' then raise exception 'Credit note must pass review before issue.'; end if;
  if length(btrim(v_note.reason)) = 0 or v_note.total_amount <= 0 then
    raise exception 'A reason and a positive credit amount are required.';
  end if;

  select * into v_invoice from public.invoices where id = v_note.invoice_id for update;
  if not found then raise exception 'Source invoice not found.'; end if;
  if v_invoice.client_id is distinct from v_note.client_id then
    raise exception 'Credit note client must match the source invoice client.';
  end if;
  if v_invoice.status = 'void' then raise exception 'A void invoice cannot be credited.'; end if;
  if v_invoice.status in ('paid', 'partial')
     and not (v_note.review_status = 'approved' and v_note.reviewed_by is not null) then
    raise exception 'Paid and partially-paid invoices require recorded Admin accounting review before a credit note can be issued.';
  end if;

  select coalesce(sum(line_subtotal), 0) into v_items_subtotal
    from public.credit_note_items where credit_note_id = p_credit_note_id;
  if v_items_subtotal <= 0 or v_items_subtotal <> v_note.subtotal then
    raise exception 'Credit-note lines must be present and their subtotal must match the header.';
  end if;  if (select coalesce(sum(round(line_subtotal * vat_rate / 100, 2)), 0)
      from public.credit_note_items where credit_note_id = p_credit_note_id) <> v_note.vat_amount then
    raise exception 'Credit-note VAT must match the VAT rates on its lines.';
  end if;
  if v_note.total_amount > coalesce(v_invoice.total_amount, 0) then
    raise exception 'Credit note exceeds the original invoice total.';
  end if;

  select coalesce(sum(total_amount), 0) into v_previous_credits
    from public.credit_notes
    where invoice_id = v_note.invoice_id and status = 'issued' and id <> p_credit_note_id;
  if v_previous_credits + v_note.total_amount > coalesce(v_invoice.total_amount, 0) then
    raise exception 'Credit note exceeds the remaining creditable invoice amount.';
  end if;

  update public.credit_notes
    set status = 'issued', issued_by = auth.uid(), issued_at = now()
    where id = p_credit_note_id;
  return jsonb_build_object('ok', true, 'credit_note_number', v_note.credit_note_number, 'issued_at', now());
end;
$$;

revoke all on function public.ngms_issue_credit_note(uuid) from public, anon;
grant execute on function public.ngms_issue_credit_note(uuid) to authenticated;

commit;
