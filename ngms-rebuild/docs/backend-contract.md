# NGMS backend integration contract — verified inventory

**Inventory date:** 29 October 2026  
**Scope:** Read-only Cloudflare inspection and code-route review. No Worker, D1, R2, Access, secret, or production resource was changed.

## Verified resources

- Cloudflare Worker `ngms-admin-api` exists and has a D1 binding named `DB` and R2 binding named `MEDIA`.
- Cloudflare Worker `ngms-public-intake` exists and is also bound to `DB`; it uses a Turnstile secret binding.
- D1 database `ngms-admin` exists. A read-only `sqlite_master` query returned tables `documents`, `enquiries`, `jobs`, `media`, `site_content`, plus SQLite metadata/migration tables.
- R2 bucket `ngmsmedia` exists. The R2 API reported no custom domains, the managed `r2.dev` endpoint is disabled, and no bucket CORS configuration exists. Current media operations are therefore expected to flow through the Worker rather than direct browser-to-R2 uploads.
- An Access application named `ngms-admin-api - Cloudflare Workers` exists with one policy. The Worker source validates a `Cf-Access-Jwt-Assertion` JWT against configured issuer/audience values.
- Both Worker source files currently allow only the origin `https://ngms-website-v4.vercel.app` for browser CORS. A separate rebuild preview URL is **not verified as allowed**.

### Aggregate record snapshot

A read-only count query on 29 October 2026 returned:

| D1 table | Records |
|---|---:|
| `enquiries` | 0 |
| `jobs` | 0 |
| `documents` | 0 |
| `media` | 2 |
| `site_content` | 3 |

These are a dated snapshot, not a guarantee that counts remain unchanged. No customer rows, document contents, or object filenames were read for this count check. The D1 database metadata endpoint reported `num_tables: 0`, but the direct read-only schema query returned the tables listed above; trust the schema query for current table inventory.

## Verified admin API route map

Routes below are present in the `ngms-admin-api` Worker source. Their existence does **not** mean the new preview has successfully called or tested them.

- `GET /health` — health response.
- `GET /api/admin/enquiries` — list enquiry records.
- `POST /api/admin/enquiries` — create an enquiry record.
- `GET /api/admin/jobs` and `POST /api/admin/jobs` — list/create job records.
- `GET /api/admin/documents` and `POST /api/admin/documents` — list/create quotation/invoice documents using the `kind` field.
- `PATCH /api/admin/{enquiries|jobs|documents}/:id` or corresponding `/status` endpoint — update supported record status.
- `GET /api/admin/media` and `POST /api/admin/media` — list/upload allowed media.
- `POST /api/admin/media/:uuid/replace`, `DELETE /api/admin/media/:uuid` or `POST /api/admin/media/:uuid/delete` — replace/delete media.
- `GET /api/admin/media/:uuid/download` — authenticated media download through the Worker.
- `GET /api/admin/content` and `PUT /api/admin/content` — read/update content keyed by content key.

The `ngms-public-intake` Worker exposes:
- `GET /api/public/site-content` — read public content from the shared D1 database.
- `POST /api/public/enquiries` — validate and save a public enquiry; requires valid submitted fields and a valid Turnstile token.

## D1 schema and known business-model limitations

- `enquiries`: `id`, `customer_name`, phone/email, service, area, details, status, creator and timestamps.
- `jobs`: `id`, `customer_name`, service, area, details, status, creator and timestamps.
- `documents`: `id`, `customer_name`, `kind` (Quotation/Invoice), `amount_cents`, status, creator and timestamps.
- `media`: object key, original name, content type, size, uploader and timestamp.
- `site_content`: content key, JSON value, updater and timestamp.

There is currently no separate customers table, quotation line-item table, invoice line-item table, payment ledger, partial-payment allocation, credit-note table, or job-assignment/status-history table in the inspected D1 schema. Consequently:
- The dashboard can display quotation/invoice documents and statuses, but it must not claim detailed quote-line calculations or a reconciled partial-payment balance.
- The “Enquiries & customers” view is currently enquiry-record centric; it is not a normalized customer CRM.
- Advanced scheduling, team assignment, profitability and audit reporting need further API/schema work before they are represented as operational.
- Any schema change or migration requires a written mapping, backup, non-production rehearsal and approval before cutover.

## Authentication and browser-origin boundary

- Admin Worker reads `Cf-Access-Jwt-Assertion`, checks signature/issuer/audience/expiry and requires an identity claim.
- Worker CORS configuration currently lists only `https://ngms-website-v4.vercel.app`. Calls from a different preview origin may fail CORS even when the API hostname is reachable.
- Do not add the new preview to the existing Worker’s allowed-origin list or alter its Access policies until the intended preview deployment/domain is known and the change is reviewed. Prefer a separate preview-specific Worker/policy where practical.
- Never place Cloudflare Access audience/secret bindings, R2 keys, Turnstile secret, or Zapier token in browser-visible environment variables or source code. Only the non-secret API base URL may use `NEXT_PUBLIC_NGMS_API_BASE`.

## Integration safety rules

- The rebuild includes a read-only client for the verified collection endpoints. It deliberately displays a configuration/error state when the API URL is blank, Access fails, CORS rejects the origin or the response does not match `{ items: [] }`.
- The dashboard must distinguish `0 records` from API unavailable, access denied, timeout, unsupported route and bad response.
- All create/update/delete actions and public form submission remain disabled until the rebuild preview origin, Access session flow, CORS behaviour and actual write persistence are tested end to end with synthetic records.
- Private media stays behind the Worker; do not enable public bucket URLs.
