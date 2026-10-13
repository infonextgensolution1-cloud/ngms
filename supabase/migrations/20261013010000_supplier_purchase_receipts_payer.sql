-- Supplier purchase receipts and payer attribution for NGMS job costing.
alter table public.supplier_purchases
  add column if not exists receipt_urls jsonb not null default '[]'::jsonb,
  add column if not exists paid_by text not null default 'company';

alter table public.supplier_purchases
  drop constraint if exists supplier_purchases_paid_by_check;

alter table public.supplier_purchases
  add constraint supplier_purchases_paid_by_check
  check (paid_by in ('company', 'subcontractor'));

update public.supplier_purchases
set receipt_urls = case
  when receipt_url is not null and receipt_urls = '[]'::jsonb then jsonb_build_array(receipt_url)
  else receipt_urls
end;
