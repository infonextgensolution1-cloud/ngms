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


---

## Isolated staging environment — created 29 October 2026

These resources are **preview-only** and separate from the original production database/bucket.

- Preview admin Worker: `ngms-admin-api-preview`
- Preview API base: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Preview D1: `ngms-admin-preview`, UUID `f12c5c48-58cd-4c48-82de-8c7341b8e6cf`
- Preview R2: `ngmsmedia-preview`
- Cloudflare Access application: `NGMS Rebuild Preview API`, protected with the same single-administrator allow criterion as the existing admin application.
- Worker bindings are verified to target the **preview** D1 and R2 resources only. The preview Worker has no Zapier token binding.
- Preview Worker CORS is configured for `https://ngms-rebuild-preview.vercel.app`. The Vercel project still has to be created/authorised, so the real browser CORS/Access flow is not yet tested.

A schema was created in preview D1 with the five table shapes copied from a read-only inspection of the existing schema. The preview database has been checked with read queries.

### Synthetic QA fixtures

Four records were inserted into the **preview D1 only**, with `created_by = REBUILD_SYNTHETIC_QA` and explicit “PREVIEW ONLY - Test Customer” labels:
- enquiry `preview-enquiry-001` — Solar Panel Cleaning / Somerset West / New;
- job `preview-job-001` — Solar Panel Cleaning / Somerset West / In progress;
- quotation `preview-quote-001` — R1,234.56 / Draft;
- invoice `preview-invoice-001` — R789.00 / Sent.

These values exist solely to test the preview interface; they must never be mistaken for genuine work, used for decisions or copied into production.

### Preview access and write gate

- The Worker continues to validate the Cloudflare Access JWT's issuer, audience, expiry and signature.
- UI mutations require `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=true` at preview build/runtime and the Worker independently requires a valid Access identity. The flag is unset by default.
- The preview UI is intended to use `NEXT_PUBLIC_NGMS_API_BASE=https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev` only as a **Vercel Preview** environment variable; it is not a secret.
- Do not set the preview API base/feature flag on the live `ngms-new` project or production environment.
- The existing production Worker, production D1, production R2 and original site's domain/DNS were not changed by this staging setup.
- Public enquiry submission remains disabled in the rebuild. The existing public-intake Worker is bound to production D1; using it for rebuild form tests would put test enquiries into production data. A separate preview intake Worker and Turnstile configuration are required before public form submissions can be enabled.
- The Worker host is configured, but an authorised browser request, CORS preflight, Access sign-in, API read, write, and R2 upload/download have **not** yet been successfully executed from the preview frontend. These remain blocked/pending until the authorised Vercel preview exists and the end-to-end checks are run.
