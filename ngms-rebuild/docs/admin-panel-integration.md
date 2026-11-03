# NGMS V4 admin-panel integration

**Status:** Workflow A backend deployed to isolated preview; frontend changes committed to draft PR #283; authenticated browser verification pending  
**Application:** `ngms-rebuild/`  
**Admin preview:** https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev/admin  
**Preview API:** https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev  
**Preview D1:** `ngms-admin-preview`  
**Preview media bucket:** `ngmsmedia-preview`  
**Latest Cloudflare build:** `d5f7d7d6-dc1a-497e-a4b4-228455d9d2a4` — success  
**Deployment:** `fd2ce28d-39f9-43cf-a323-05d5f615ce35`  
**Active preview version:** `5214d3fb-3758-48f3-8adf-650c1853193b` (version 18; 100% of preview traffic)  
**Preview API Worker:** `ngms-admin-api-preview` version 51 (Workflow A conversion/quotation decision lifecycle; 100% preview traffic)
**Preview public intake Worker:** `ngms-public-intake-preview` version 38 (Turnstile CORS allow-list includes the isolated preview website; 100% preview traffic)
**Public quote token Access app:** `NGMS Preview Public Quote Decisions` — Bypass/Everyone for `/api/public/quotes/*` only; administrator endpoints remain protected  
**GitHub rebuild CI:** [passed](https://github.com/infonextgensolution1-cloud/ngms/actions/runs/41593797443) — dependency audit, TypeScript, no-Supabase guard, Next.js build, Docker build and seven route smoke tests  
**Root build/release gate:** [passed](https://github.com/infonextgensolution1-cloud/ngms/actions/runs/41593797422)  
**Draft PR:** [#283](https://github.com/infonextgensolution1-cloud/ngms/pull/283) — open and unmerged

## What is connected in the code

- The overview requests enquiries/jobs plus formal quotations and formal invoices from the protected preview API. It shows metrics only after all four reads succeed.
- Enquiries, jobs, media and website content continue to use their documented collection endpoints. Quotations and invoices now use `/api/admin/commercial-documents`, not the legacy generic documents collection. The quotation screen loads CRM customers and supports itemised lines, quantities, units, unit prices, discounts, saved VAT settings and notes. A preview-only customer form creates CRM records through `POST /api/admin/customers`.
- Invoice creation is restricted to accepted quotations that do not already have an active invoice. The invoice API copies the approved line items, discount and VAT treatment from the source quotation. The preview Worker also checks for an existing invoice, and preview D1 has a partial unique index as a database-level guard.
- Formal quotation/invoice lists display the NGMS document reference and status. The item-details panel reads saved line items and VAT/discount totals.
- Workflow A binds a quotation to its originating CRM enquiry before a 30-day one-use link can be issued. On acceptance the preview Worker creates one job linked to the customer and quotation, changes the enquiry to Converted and records customer activity. A decline creates no job. The public `/quote/:token` page reads the quote from the preview API and displays its itemised lines and totals. The new enquiry-to-CRM action, source-enquiry selector and public quote request form are in draft PR #283; they are not yet part of the active frontend preview.
- Invoices include a payment-history/balance panel. The UI can record partial payments using the deployed ledger API; the Worker rejects payments above the outstanding balance and marks the invoice Paid only when the full amount has been allocated. Paid is not a manual status option.
- The media table still provides an authenticated Worker open/download link. Website-content JSON objects render as readable JSON. Scheduling endpoints exist in the API; the current generic calendar screen has not yet been connected to their date-range and mutation contract. Reports and settings remain unavailable.
- The browser client accepts only HTTPS requests to the dedicated `ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev` host. A blank, malformed, or alternate target is blocked client-side; this preview cannot be pointed at the production API with the public build variable.
- API requests use `credentials: "include"`, no-store caching, and typed checks for the collection `{ items: [] }` response shape. API errors remain errors; they are not presented as zero records.
- The admin overview and modules expose an “Open secure API sign-in / health check” link to `/health` on the approved preview API. This opens the Access-protected API host directly, which gives the administrator a place to complete the Cloudflare Access sign-in before returning to the admin page and refreshing.
- Formal quotation payloads use `kind: "Quotation"`, a CRM `customer_id`, itemised `lines`, an optional discount amount, VAT selection and notes. Prices are sent in ZAR and converted to integer cents by the Worker.
- Formal invoice payloads use `kind: "Invoice"` and `source_document_id` for an accepted quotation. The server derives customer, line items, discount and VAT from that accepted source; the browser does not send a second arbitrary invoice total.
- Quotation statuses are `Draft`, `Sent`, `Accepted`, `Declined`, `Expired` and `Cancelled`. Invoice statuses available in the UI are `Draft`, `Sent`, `Overdue` and `Cancelled`; payment status is not claimed.
- The write flag remains `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`. Admin create/update/media upload and the new CRM/quotation actions remain disabled pending authenticated browser acceptance. The public quote request form is protected by Turnstile, but must be tested from the actual preview browser before it is enabled for customers. Server-side Access validation remains required independently of the UI flag.

## Safe browser verification steps

1. Open the admin preview URL above in the intended administrator browser.
2. Use **Open secure API sign-in / health check**. Complete Cloudflare Access sign-in for the permitted administrator. The browser may show a health response at the API host after authentication; return to the admin preview when that finishes.
3. Select **Refresh data** on the overview. A connected result means all four KPI source reads succeeded; otherwise read the error shown by the interface.
4. Open **Enquiries**, **Jobs**, **Quotations**, **Invoices**, **Media library** and **Website content**. Confirm returned preview records, a genuine empty response, or an explicit API error. Formal quotations/invoices must come from `/api/admin/commercial-documents`, not the generic `documents` collection.
5. On Quotations, confirm the CRM customer list loads. In the controlled preview-write test, add a clearly synthetic customer, create a multi-line quotation, and verify the returned NGMS reference and stored line items.
6. Create a customer link for the synthetic quotation. Open the link in a separate browser session, confirm the itemised quote renders, then accept it once. Verify a repeat decision is rejected. Do not manually set Accepted in the admin status editor.
7. Create one invoice from the accepted quote. Verify source lines, discount and VAT are carried over. Try to create a second invoice from the same quote and confirm HTTP 409, including if the first invoice is later Cancelled.
8. Record a partial invoice payment and verify paid/balance amounts. Record the remaining balance and verify the invoice becomes Paid. Try an overpayment and confirm HTTP 409. Do not use real customer/payment data.
9. Confirm the write buttons/upload chooser remain disabled while the write flag is `false`. Do not enable writes until the browser login/read path has passed.
8. If a request fails, check Cloudflare Access sign-in/session, the preview API host, the preview Worker CORS allowlist, Access `options_preflight_bypass` and the browser's request/response details. Do not add the preview origin to the production Worker.

## What is not yet accepted

The preview UI Access application `NGMS Rebuild Preview Admin UI` protects both the exact `/admin` route and `/admin/*` descendants with the single-authorised-administrator Allow policy. Public preview pages are not included in these path destinations. The preview API CORS allowlist includes the exact Cloudflare-hosted preview application origin. The separate preview API Access application bypasses Access only for OPTIONS preflight requests; actual admin API requests remain subject to the single-administrator Access policy and Worker JWT validation. The formal commercial-document routes, CRM routes, duplicate-invoice guard and D1 migrations have been applied to preview. However, a human-browser Access login, real CORS preflight, successful frontend API reads, R2 listing/download and controlled create/update/upload persistence have not yet been independently verified. CI build checks do not prove those interactive flows. The media open/download action is not accepted until its browser test passes.

Preview-only QA fixtures may already exist in the preview D1 database. Their visibility from the browser has not yet been confirmed. The new formal quotation/invoice screens only list documents with formal references; the older generic test documents without references are not promoted as formal commercial documents. Do not copy synthetic fixtures into production or treat them as genuine customers, jobs, quotations or invoices.

## Data-model limitations

D1 now provides CRM customers/contacts/activity, formal quotation and invoice documents with line items, yearly document sequences, a partial-payment ledger, expiring one-use public quotation links, job schedules and operation records. Refunds/reversals, credit-note allocation, complete job assignment/status history and agreed profitability/reporting model remain absent. The payment API calculates invoice balance from the recorded payment ledger; it does not represent refunds or credits.

Public enquiry submission remains disabled because the existing public-intake Worker is bound to production D1. A dedicated preview intake Worker and Turnstile configuration are required before enabling public submissions or photo attachments.

## Release boundary

The live website and public domain remain on the existing production deployment. Do not merge the existing V4 preview pull request or change public routing until the acceptance matrix is complete and production release is explicitly approved.

Related records:
- [V4 blueprint-to-acceptance matrix](v4-acceptance-matrix.md)
- [Backend contract and security boundaries](backend-contract.md)
- [Cloudflare preview deployment](cloudflare-preview-deployment.md)


## Workflow A preview boundary — 3 November 2026

- The preview public intake Worker was updated only to allow CORS requests from `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev`. Existing production CORS origins and the production public-intake Worker were not altered.
- The preview admin Worker includes enquiry-to-CRM conversion, source-enquiry-bound quotation links, one-use customer decision handling and job creation on acceptance. It returns the generated `job_id`; the commercial document list exposes the linked job ID for the admin UI.
- A separate Access application bypasses Access authentication only for `/api/public/quotes/*`. The endpoint is not an admin API, uses a random token, stores only its hash, expires the link after 30 days, and allows one decision. The administrator API paths remain behind the existing Access policy.
- The preview database uses existing migrations 0011 and 0012 for the customer/enquiry map, quote links and job uniqueness. No additional schema migration was applied for Workflow A.
- The active preview frontend has not yet been updated to this PR's latest source. CI is green, but browser checks and full synthetic end-to-end tests remain outstanding.
