# NGMS V4 admin-panel integration

**Status:** formal quotation/invoice integration implemented on the isolated work branch; preview API and D1 updated; authenticated browser verification pending  
**Application:** `ngms-rebuild/`  
**Admin preview:** https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev/admin  
**Preview API:** https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev  
**Preview D1:** `ngms-admin-preview`  
**Preview media bucket:** `ngmsmedia-preview`  
**Latest build:** `a1887958-1a6d-4256-98a4-4f8bb7e71bfd` — success  
**Deployment:** `02fe4141-9afb-443b-a1d9-f5deb671127d`  
**Active preview version:** `cce817ca-43a9-4872-b72f-80db57bd610e` (100% of preview traffic)  
**V4 CI run #105:** [passed](https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938991776) — includes `/admin`, `/admin/enquiries` and `/admin/media` route smoke tests

## What is connected in the code

- The overview requests enquiries/jobs plus formal quotations and formal invoices from the protected preview API. It shows metrics only after all four reads succeed.
- Enquiries, jobs, media and website content continue to use their documented collection endpoints. Quotations and invoices now use `/api/admin/commercial-documents`, not the legacy generic documents collection. The quotation screen loads CRM customers and supports itemised lines, quantities, units, unit prices, discounts, saved VAT settings and notes. A preview-only customer form creates CRM records through `POST /api/admin/customers`.
- Invoice creation is restricted to accepted quotations that do not already have an active invoice. The invoice API copies the approved line items, discount and VAT treatment from the source quotation. The preview Worker also checks for an existing invoice, and preview D1 has a partial unique index as a database-level guard.
- Formal quotation/invoice lists display the NGMS document reference and status. Document status updates use the formal commercial-document status route. The invoice UI does not offer a `Paid` status because no payment ledger/reconciliation flow exists.
- The media table still provides an authenticated Worker open/download link. Website-content JSON objects render as readable JSON. Scheduling endpoints exist in the API; the current generic calendar screen has not yet been connected to their date-range and mutation contract. Reports and settings remain unavailable.
- The browser client accepts only HTTPS requests to the dedicated `ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev` host. A blank, malformed, or alternate target is blocked client-side; this preview cannot be pointed at the production API with the public build variable.
- API requests use `credentials: "include"`, no-store caching, and typed checks for the collection `{ items: [] }` response shape. API errors remain errors; they are not presented as zero records.
- The admin overview and modules expose an “Open secure API sign-in / health check” link to `/health` on the approved preview API. This opens the Access-protected API host directly, which gives the administrator a place to complete the Cloudflare Access sign-in before returning to the admin page and refreshing.
- Formal quotation payloads use `kind: "Quotation"`, a CRM `customer_id`, itemised `lines`, an optional discount amount, VAT selection and notes. Prices are sent in ZAR and converted to integer cents by the Worker.
- Formal invoice payloads use `kind: "Invoice"` and `source_document_id` for an accepted quotation. The server derives customer, line items, discount and VAT from that accepted source; the browser does not send a second arbitrary invoice total.
- Quotation statuses are `Draft`, `Sent`, `Accepted`, `Declined`, `Expired` and `Cancelled`. Invoice statuses available in the UI are `Draft`, `Sent`, `Overdue` and `Cancelled`; payment status is not claimed.
- The write flag remains `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`. Create, update and media upload remain disabled pending authenticated browser acceptance. Server-side Access validation remains required independently of the UI flag.

## Safe browser verification steps

1. Open the admin preview URL above in the intended administrator browser.
2. Use **Open secure API sign-in / health check**. Complete Cloudflare Access sign-in for the permitted administrator. The browser may show a health response at the API host after authentication; return to the admin preview when that finishes.
3. Select **Refresh data** on the overview. A connected result means all four KPI source reads succeeded; otherwise read the error shown by the interface.
4. Open **Enquiries**, **Jobs**, **Quotations**, **Invoices**, **Media library** and **Website content**. Confirm returned preview records, a genuine empty response, or an explicit API error. Formal quotations/invoices must come from `/api/admin/commercial-documents`, not the generic `documents` collection.
5. On Quotations, confirm the CRM customer list loads. In the controlled preview-write test, add a clearly synthetic customer, create a multi-line quotation, and verify the returned NGMS reference and stored line items.
6. Mark that synthetic quotation Accepted, then create one invoice from it. Verify that the invoice inherits the source lines and VAT/discount values. Attempt a second invoice for the same quotation and confirm the Worker rejects it with HTTP 409. Do not test on production data.
5. Confirm the write buttons/upload chooser remain disabled while the write flag is `false`. Do not test by switching the flag on yet.
6. If a request fails, check Cloudflare Access sign-in/session, the preview API host, preview Worker CORS allowlist and the browser's request/response details. Do not add the preview origin to the production Worker.

## What is not yet accepted

The preview Worker CORS allowlist has now been updated to include the exact Cloudflare-hosted preview application origin. The formal commercial-document routes, CRM routes, duplicate-invoice guard and D1 migrations have been inspected/applied. However, a human-browser Access login, actual CORS preflight, successful frontend API reads, R2 listing/download and controlled create/update/upload persistence have not yet been independently verified. The tool environment cannot complete the intended administrator's browser session. CI build checks do not prove those interactive flows. The media open/download action is not accepted until its browser test passes.

Preview-only QA fixtures may already exist in the preview D1 database. Their visibility from the browser has not yet been confirmed. The new formal quotation/invoice screens only list documents with formal references; the older generic test documents without references are not promoted as formal commercial documents. Do not copy synthetic fixtures into production or treat them as genuine customers, jobs, quotations or invoices.

## Data-model limitations

D1 now provides CRM customers/contacts/activity, formal quotation and invoice documents with line items, yearly document sequences, job schedules and operation records. A payment ledger, partial-payment allocation, credit-note allocation, complete job assignment/status history and agreed profitability/reporting model are still absent. Invoice face value is therefore not a reconciled balance due.

Public enquiry submission remains disabled because the existing public-intake Worker is bound to production D1. A dedicated preview intake Worker and Turnstile configuration are required before enabling public submissions or photo attachments.

## Release boundary

The live website and public domain remain on the existing production deployment. Do not merge the existing V4 preview pull request or change public routing until the acceptance matrix is complete and production release is explicitly approved.

Related records:
- [V4 blueprint-to-acceptance matrix](v4-acceptance-matrix.md)
- [Backend contract and security boundaries](backend-contract.md)
- [Cloudflare preview deployment](cloudflare-preview-deployment.md)
