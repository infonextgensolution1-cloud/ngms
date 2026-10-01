-- NGMS Sales Engine: secure customer quote links and acceptance
-- Bearer tokens are unguessable and are never exposed through the public Supabase Data API.

alter table public.quote_versions
  add column if not exists public_token text;

create unique index if not exists quote_versions_public_token_uidx
  on public.quote_versions(public_token)
  where public_token is not null;

update public.quote_versions
set public_token = encode(gen_random_bytes(24), 'hex')
where public_token is null;

alter table public.quote_versions enable row level security;

comment on column public.quote_versions.public_token is
  'Unpredictable bearer token for the customer-facing quote version URL.';

-- Keep the version snapshots self-contained for existing quotes.
update public.quote_versions v
set snapshot = jsonb_build_object(
  'quote', to_jsonb(q),
  'client', to_jsonb(c),
  'items', coalesce((select jsonb_agg(to_jsonb(qi) order by qi.id) from public.quote_items qi where qi.quote_id=q.id),'[]'::jsonb),
  'money', jsonb_build_object(
    'subtotal', coalesce(q.total_amount,0),
    'vat', 0,
    'total', coalesce(q.total_amount,0),
    'deposit', coalesce(q.deposit_amount,0)
  ),
  'version', v.version_number,
  'source', 'migration'
)
from public.quotes q
left join public.clients c on c.id=q.client_id
where v.quote_id=q.id and v.version_number=1;
