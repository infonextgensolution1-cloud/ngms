# NGMS backend integration contract — verified inventory

**Updated:** 3 November 2026  
**Scope:** Production inventory remained read-only. Implementation changes were restricted to the dedicated preview API Worker and `ngms-admin-preview` D1 database. No production Worker, D1, R2, DNS or customer record was changed.

## Verified resources

- Cloudflare Worker `ngms-admin-api` exists and has a D1 binding named `DB` and R2 binding named `MEDIA`.
- Cloudflare Worker `ngms-public-intake` exists and is also bound to `DB`; it uses a Turnstile secret binding.
- D1 database `ngms-admin` exists. A read-only `sqlite_master` query returned tables `documents`, `enquiries`, `jobs`, `media`, `site_content`, plus SQLite metadata/migration tables.
- R2 bucket `ngmsmedia` exists. The R2 API reported no custom domains, the managed `r2.dev` endpoint is disabled, and no bucket CORS configuration exists. Current media operations are therefore expected to flow through the Worker rather than direct browser-to-R2 uploads.
- An Access application named `ngms-admin-api - Cloudflare Workers` exists with one policy. The Worker source validates a `Cf-Access-Jwt-Assertion` JWT against configured issuer/audience values.
- **Production boundary:** the existing production admin/intake Worker configuration is separate and must retain its production allowlist. The production admin Worker source reviewed for this inventory lists `https://ngms-website-v4.vercel.app`; the V4 preview origin must not be added to production just to make preview tests work.

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
- `GET /api/admin/documents` and `POST /api/admin/documents` — legacy/basic document collection.
- `GET /api/admin/commercial-documents?kind=Quotation|Invoice&status=...` — formal quotation/invoice list, filtered by document kind and optional status.
- `POST /api/admin/commercial-documents` — create an itemised formal quotation, or create an invoice from an accepted quotation.
- `GET /api/admin/commercial-documents/:id` — retrieve a formal document with its line items.
- `PATCH /api/admin/commercial-documents/:id/status` — update permitted formal document statuses. Customer decisions are recorded through the one-use public link, not the manual status editor.
- `POST /api/admin/commercial-documents/:id/share` — create a 30-day one-use customer link and move a Draft quotation to Sent.
- `GET /api/admin/commercial-documents/:id/payments` and `POST /api/admin/commercial-documents/:id/payments` — view/record invoice payments, calculate paid/balance cents, reject overpayment and mark Paid only when fully paid.
- `POST /api/admin/commercial-documents/:id/convert-to-job` — create one job from an accepted quotation.
- `GET /api/admin/customers` and `POST /api/admin/customers` — list/create CRM customers.
- `GET /api/public/quotes/:token` and `POST /api/public/quotes/:token` — retrieve a token-protected quotation and record its single Accepted/Declined decision.
- `GET/POST /api/admin/schedules` and `PATCH/DELETE /api/admin/schedules/:id` — schedule records.
- `GET/POST/PATCH/DELETE /api/admin/operations/{maintenance|suppliers|inventory|financials}/:id?` — operation records.
- `GET /api/admin/media` and `POST /api/admin/media` — list/upload allowed media.
- `POST /api/admin/media/:uuid/replace`, `DELETE /api/admin/media/:uuid` or `POST /api/admin/media/:uuid/delete` — replace/delete media.
- `GET /api/admin/media/:uuid/download` — authenticated media download through the Worker.
- `GET /api/admin/content` and `PUT /api/admin/content` — read/update content keyed by content key.

The `ngms-public-intake` Worker exposes:
- `GET /api/public/site-content` — read public content from the shared D1 database.
- `POST /api/public/enquiries` — validate and save a public enquiry; requires valid submitted fields and a valid Turnstile token.

## D1 schema and business-model boundaries

The production and preview D1 databases contain the core business tables below:

- `customers`, `customer_contacts`, `customer_activity`: normalized CRM customers, contacts and activity notes.
- `enquiries`: customer name, phone/email, requested service, area, details, status, creator, deduplication keys and timestamps.
- `jobs`: job/site, service, area, details, status and optional customer relationship.
- `documents`: formal quotations/invoices, customer relationship, reference, issue/due dates, amount/subtotal/discount/VAT cents, status, notes and invoice source document.
- `document_line_items`: item description, quantity, unit, unit price cents and line total cents, linked to a document.
- `document_sequences`: yearly formal quotation and invoice number sequences.
- `document_payments`: invoice payment ledger with amount cents, payment date, method, reference, notes and recorder.
- `quote_public_links`: hashed, expiring, one-use customer quote decisions, with accepted/declined outcome.
- `enquiry_customer_links`: explicit enquiry-to-CRM customer relationship.
- `schedules`: scheduled start/end, assigned person, customer/site, status and notes.
- `projects`, `media`, `site_content`: project records, R2 media metadata and CMS content.
- `operation_records`: maintenance, supplier, inventory and financial operational records.

The formal commercial-document API is the supported route for new quotations and invoices. The generic `/api/admin/documents` endpoint remains for legacy/basic records and must not be used by the V4 commercial-document forms.

Business-model limitations remain:
- The deployed payment API allocates recorded payments to one invoice, calculates the remaining balance, prevents overpayment and sets Paid only when payment allocations cover invoice face value. Refunds, payment reversals and credit-note allocation are not yet implemented.
- One invoice is permitted per source quotation, including after cancellation, matching the stricter `idx_documents_one_invoice_per_quote` index and server-side duplicate-source check.
- A complete job status/assignment history is not yet implemented.
- Financial profitability reports need agreed labour/material allocation and overhead definitions.

Any production schema migration requires a verified backup, duplicate/data preflight checks, non-production rehearsal and explicit release approval.

## Authentication and browser-origin boundary

- Admin Worker reads `Cf-Access-Jwt-Assertion`, checks signature/issuer/audience/expiry and requires an identity claim.
- The production admin Worker CORS configuration remains separate. Do not add preview app origins to the production Worker or change production Access.
- The dedicated `ngms-admin-api-preview` Worker (version 49) allowlists `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev`. The preview API Access app `NGMS Rebuild Preview API` has `options_preflight_bypass=true`, so anonymous OPTIONS requests reach the Worker CORS handler. All actual admin API requests still pass through Cloudflare Access and Worker JWT signature/issuer/audience/expiry validation.
- A separate preview UI Access app protects the exact `/admin` path and `/admin/*` routes using the single authorised administrator policy; public pages and token quotation routes remain outside those UI paths. These changes were made only in preview. Real human-browser sign-in and preflight still require acceptance testing.
- Do not add the V4 preview origin to the existing production Worker’s allowlist. Use the preview-specific Worker/policy for preview validation.
- Never place Cloudflare Access audience/secret bindings, R2 keys, Turnstile secret, or Zapier token in browser-visible environment variables or source code. Only the non-secret API base URL may use `NEXT_PUBLIC_NGMS_API_BASE`.

## Integration safety rules

- The rebuild client permits only the dedicated HTTPS preview API hostname, exposes an API health/sign-in link for Cloudflare Access and displays explicit configuration/error state instead of assuming empty collections. The admin UI reads formal commercial documents, CRM customers, item lines and invoice payment records. Public quotation decisions use one-use tokens rather than exposing private document identifiers. Browser API/CORS/media behaviour still requires human-browser verification.
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
- The preview API Worker source was inspected and its CORS allowlist includes `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev` plus the earlier intended `https://ngms-rebuild-preview.vercel.app` origin. This preview allowlist is separate from the production Worker configuration. The real browser CORS/Access flow is still not independently tested.

The preview D1 schema records application migrations 0005, 0006 and 0007–0012:
- 0007 records the already-present scheduling table/indexes.
- 0008 creates `operation_records` and category indexes.
- 0009 adds a partial unique active-invoice/source-quotation index.
- 0011 adds the `document_payments` ledger, `enquiry_customer_links`, the job source-quotation relationship and the stricter unique index allowing only one invoice per source quotation, including after cancellation.
- 0012 adds hashed, expiring, one-use `quote_public_links` for customer quotation decisions and the quote-to-job uniqueness index.

The invoice and job duplicate preflight queries returned no rows before the corresponding uniqueness constraints were verified. Migrations 0011 and 0012 were already present in preview D1; their SQL source files are now tracked in `cloudflare/migrations/`. No production D1 migration was applied.

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
- The deployed Cloudflare V4 preview uses `NEXT_PUBLIC_NGMS_API_BASE=https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev` as a non-secret build variable. The API endpoint and Access policy are preview-specific; do not place the preview API base or preview feature flags into the live production environment.
- Do not set the preview API base/feature flag on the live `ngms-new` project or production environment.
- The existing production Worker, production D1, production R2 and original site's domain/DNS were not changed by this staging setup.
- Public enquiry submission remains disabled in the rebuild. The existing public-intake Worker is bound to production D1; using it for rebuild form tests would put test enquiries into production data. A separate preview intake Worker and Turnstile configuration are required before public form submissions can be enabled.
- Preview API Access application `NGMS Rebuild Preview API` retains the single-administrator allow policy; only OPTIONS preflight bypass is enabled. Preview admin UI paths have their own single-administrator Access application. Formal commercial, public quotation-decision and payment endpoints are present in the deployed API. However, authorised browser sign-in, actual browser CORS, API reads, public quote acceptance, payment recording and R2 download have **not** yet been completed from a human browser. Keep admin write controls disabled until those tests are performed with synthetic preview records.


## Related acceptance record

- [V4 blueprint-to-acceptance matrix](v4-acceptance-matrix.md) — current requirement status, available evidence, exit criteria and production release gate.
- [Implementation status](implementation-status.md)
- [Cloudflare preview deployment](cloudflare-preview-deployment.md)
