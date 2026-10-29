# NGMS V4 admin-panel integration

**Status:** admin integration code deployed to preview; authenticated browser verification pending  
**Application:** `ngms-rebuild/`  
**Admin preview:** https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev/admin  
**Preview API:** https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev  
**Preview D1:** `ngms-admin-preview`  
**Preview media bucket:** `ngmsmedia-preview`  
**Latest build:** `a1887958-1a6d-4256-98a4-4f8bb7e71bfd` — success  
**Deployment:** `02fe4141-9afb-443b-a1d9-f5deb671127d`  
**Active preview version:** `cce817ca-43a9-4872-b72f-80db57bd610e` (100% of preview traffic)  
**V4 CI run #95:** [passed](https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938100852)

## What is connected in the code

- The overview requests `GET /api/admin/enquiries`, `GET /api/admin/jobs` and `GET /api/admin/documents` from the protected preview API and shows metrics only after all three reads succeed.
- Enquiries, jobs, quotations, invoices, media and website content modules use the preview API collection client where a route is documented. The media table now provides an authenticated Worker open/download link for each row with a safe record identifier. Website-content JSON objects render as readable JSON. Calendar, reports and settings remain unavailable because the current backend contract does not expose those datasets.
- The browser client accepts only HTTPS requests to the dedicated `ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev` host. A blank, malformed, or alternate target is blocked client-side; this preview cannot be pointed at the production API with the public build variable.
- API requests use `credentials: "include"`, no-store caching, and typed checks for the collection `{ items: [] }` response shape. API errors remain errors; they are not presented as zero records.
- The admin overview and modules expose an “Open secure API sign-in / health check” link to `/health` on the approved preview API. This opens the Access-protected API host directly, which gives the administrator a place to complete the Cloudflare Access sign-in before returning to the admin page and refreshing.
- Quotation/invoice create payloads use integer `amount_cents` for the documented D1 schema. Status dropdowns distinguish quotation from invoice states, and an unknown current status is not silently replaced by a valid status option.
- The write flag is `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`. Create, update and media upload remain disabled. Server-side Access validation remains required independently of the UI flag.

## Safe browser verification steps

1. Open the admin preview URL above in the intended administrator browser.
2. Use **Open secure API sign-in / health check**. Complete Cloudflare Access sign-in for the permitted administrator. The browser may show a health response at the API host after authentication; return to the admin preview when that finishes.
3. Select **Refresh data** on the overview. A connected result means the API collection reads succeeded; otherwise read the error shown by the interface.
4. Open **Enquiries**, **Jobs**, **Quotations**, **Invoices**, **Media library** and **Website content**. Confirm the app shows returned preview records, a genuine empty response, or an explicit API error. Do not interpret an error as zero.
5. Confirm the write buttons/upload chooser remain disabled while the write flag is `false`. Do not test by switching the flag on yet.
6. If a request fails, check Cloudflare Access sign-in/session, the preview API host, preview Worker CORS allowlist and the browser's request/response details. Do not add the preview origin to the production Worker.

## What is not yet accepted

The integration code and its safe defaults are present, but a human-browser Access login, CORS preflight, successful API reads, R2 listing/download, and create/update/upload persistence have not been independently verified from the frontend. The current tool environment could not fetch the `workers.dev` pages directly. The page-level CI workflow verifies compilation and local Docker smoke tests, not these interactive API flows. The media open/download action is wired to the documented authenticated endpoint but is not accepted as working until that browser test passes.

The four synthetic test fixtures documented in the backend contract belong only to preview D1. Their visibility from the browser has not yet been confirmed. Do not copy them into production or treat them as genuine customers, jobs, quotations or invoices.

## Data-model limitations

The current inspected D1 schema does not provide a normalized customer CRM, quotation/invoice line items, partial-payment ledger, credit-note allocation, job assignment/status history, or scheduling/reporting datasets. The current invoice overview uses status-based invoice face value only and must not be presented as a reconciled amount due.

Public enquiry submission remains disabled because the existing public-intake Worker is bound to production D1. A dedicated preview intake Worker and Turnstile configuration are required before enabling public submissions or photo attachments.

## Release boundary

The live website and public domain remain on the existing production deployment. Do not merge the existing V4 preview pull request or change public routing until the acceptance matrix is complete and production release is explicitly approved.

Related records:
- [V4 blueprint-to-acceptance matrix](v4-acceptance-matrix.md)
- [Backend contract and security boundaries](backend-contract.md)
- [Cloudflare preview deployment](cloudflare-preview-deployment.md)
