# NGMS rebuild implementation status

**Updated:** 29 October 2026  
**Current preview branch:** `preview/ngms-cloudflare-worker`  
**App root:** `ngms-rebuild/`  
**Production boundary:** no production website, DNS, Vercel production alias, Worker configuration, D1 schema or customer record has been changed by the rebuild work. Existing repository PR [#274](https://github.com/infonextgensolution1-cloud/ngms/pull/274) (“Preview/ngms cloudflare worker”) remains open and unmerged; it is not approval to merge or cut over. Do not merge or change public routing until the mandatory release gate in [v4-acceptance-matrix.md](v4-acceptance-matrix.md) is complete and production release is explicitly approved.

## Acceptance control

Use [v4-acceptance-matrix.md](v4-acceptance-matrix.md) as the requirement-to-evidence checklist. The matrix records implemented scope separately from verified tests and keeps the release state **PREVIEW ONLY — NOT APPROVED FOR PRODUCTION** until the mandatory release checks pass.

## Implemented in the isolated app

- NGMS public shell with the brand's embedded logo, navigation, footer, mobile contact CTA and consistent orange/black/white/warm-neutral styling.
- Homepage, all 12 service category cards and detail templates, service directory, Helderberg solar page, Strand/Gordon's Bay/Somerset West area pages, and templates for contact, about, maintenance plans, body corporates, portfolio, gallery, pricing, FAQ, privacy, terms and solar ROI.
- Imported the verified NGMS logo and two existing solar marketing images into the isolated app. Images are used as general brand/service imagery, not represented as verified customer project evidence.
- Admin navigation and responsive visual shell matching the public brand.
- Admin collection client for currently documented endpoints: enquiries, jobs, documents (quotations/invoices), media and content. The dashboard reads counts/recent records only after all required collection calls succeed; it distinguishes confirmed empty collections from configuration, network, Access, CORS and response errors.
- The browser-side API client is pinned to the dedicated HTTPS preview API hostname; it blocks blank, malformed or alternative (including production) API targets before sending a request. Overview and module screens provide an API health/sign-in link to help the administrator complete Cloudflare Access before refreshing.
- Media rows include a Worker-based authenticated open/download link; website-content JSON values are rendered readably. Media listing/download still requires real-browser Access/CORS testing. Upload, replace, deletion, creation and status updates remain disabled.
- No false live metrics, customer names, quotation amounts, invoice balances or record writes are simulated. Calendar, reporting and settings remain marked unavailable until their contracts are implemented.
- Compatibility screens for existing quote/maintenance/job-tracking token routes; they do not display tokens or read or mutate private records.
- Next.js 16.4.3 and React/React DOM 19.2.9 in the isolated package; no Supabase SDK or app-side Supabase client.
- CI workflow includes locked dependency installation, high/critical dependency audit, TypeScript validation, a Supabase source/lockfile/dependency-tree guard, a Next.js production build, Docker image build, container start and smoke tests for the three priority public pages, admin overview, admin enquiries, admin media and the branded `/icon.svg` asset.

## Verified Cloudflare inventory (read-only)

- Worker `ngms-admin-api` exists, with D1 binding `DB` and R2 binding `MEDIA`.
- Worker `ngms-public-intake` exists, shares the D1 binding and uses a Turnstile secret.
- D1 database `ngms-admin` exists, UUID `12f7ab7e-adf6-4eb4-a118-29c4ab94cd41`.
- Schema query returned tables: `enquiries`, `jobs`, `documents`, `media`, `site_content`, plus migration/SQLite metadata.
- R2 bucket `ngmsmedia` exists. R2 managed public `r2.dev` is disabled; there are no custom domains or bucket CORS configuration.
- Admin Worker source exposes list/create for enquiries, jobs and documents; list/upload/replace/download/delete for media; GET/PUT for content; plus status updates.
- Public intake source exposes site-content GET and enquiry POST with server validation and Turnstile verification.
- The original production Workers retain their production CORS allowlist. The separate `ngms-admin-api-preview` Worker source was inspected: its allowlist includes `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev` and the earlier `https://ngms-rebuild-preview.vercel.app` origin. The preview Worker has its own single-administrator Cloudflare Access application and preview-only D1/R2 bindings.
- Read-only aggregate count on 29 October 2026: enquiries 0, jobs 0, documents 0, media 2, site_content 3. No row-level customer data or media filenames were read for this count check.

See [backend-contract.md](backend-contract.md) for the verified endpoint map, schema details, limitations and security boundaries. See [admin-panel-integration.md](admin-panel-integration.md) for the connected screens, authenticated preview workflow and browser verification steps.

## Current verification evidence — 29 October 2026

The V4 source on `preview/ngms-cloudflare-worker` builds and deploys to the dedicated Cloudflare Worker:

- Latest Cloudflare Workers Build: `a1887958-1a6d-4256-98a4-4f8bb7e71bfd` — **success**, source commit `d0d39d5c224718b3e3dffa4ceb3975148f9bb79f` (admin API host guard, Access sign-in link, amount-cents mapping, safe status selection and media open/download action).
- Latest preview deployment: `02fe4141-9afb-443b-a1d9-f5deb671127d`; active preview Worker version `cce817ca-43a9-4872-b72f-80db57bd610e` is assigned 100% of preview Worker traffic.
- Previous GitHub Actions V4 CI run: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40904904067 — **success** for dependency audit, TypeScript, Supabase guard, Next.js build, Docker build and smoke tests for the three priority pages.
- Docker smoke tests previously confirmed HTTP 200 and expected page markers for `/services/solar-panel-cleaning`, `/maintenance-packages` and `/body-corporate-maintenance`.
- Runtime telemetry review found 308 HTTP 200 responses and one HTTP 404 in the sampled 24-hour window; the 404 was specifically `/favicon.ico`. Added the NGMS-branded `app/icon.svg`. The successful Cloudflare build generated `/icon.svg` and uploaded the icon asset.
- V4 acceptance workflow run #80: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40922977824 — **success** for dependency audit, TypeScript, Supabase guard, Next.js build, Docker image build, and smoke tests for the three priority pages plus `/icon.svg`. The run was triggered by a documentation-only PR against the current preview branch; PR #277 was closed unmerged.
- V4 acceptance workflow run #95: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938100852 — **success** after the admin integration changes. TypeScript, dependency audit, Supabase guard, Next.js build, Docker image build, and HTTP 200 marker checks for the three priority pages plus `/icon.svg` all passed. This was triggered through a documentation-only PR against the current preview base; it does not verify browser-based Access/CORS/API/media behavior.
- V4 acceptance workflow run #105: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938991776 — **success** after adding CI smoke tests for `/admin`, `/admin/enquiries` and `/admin/media`. It passed dependency audit, TypeScript, the no-Supabase guard, Next.js build, Docker build and HTTP 200 marker checks for all seven public/admin/icon routes. The documentation-only PR #279 was closed unmerged. Browser-based Access/CORS/API/media verification remains outstanding.
- Production remains separate: V4 is on its dedicated `workers.dev` preview URL. This work did not switch the public domain or alter production resources.

The latest admin integration code passed the Cloudflare build/deployment and V4 CI run #95 (dependency audit, TypeScript, no-Supabase guard, Next.js build, Docker build and container smoke tests). This is not full browser acceptance: the execution environment cannot resolve the `workers.dev` hostnames, so visual regression, real Access sign-in/CORS/API reads and authenticated R2 download have not been independently completed.

## Outstanding acceptance tests

- Visually inspect desktop and mobile at 320, 375, 768, 1024 and desktop widths in a normal browser.
- Sign in to Cloudflare Access from the intended administrator browser, then verify preview API reads, CORS preflight and empty/error states.
- Verify authenticated R2 media access from the preview interface. Keep preview writes disabled until an explicit end-to-end persistence test with synthetic data is run.
- Run WCAG 2.2 AA baseline, SEO URL parity, performance, privacy/security and route-regression reviews.
- The D1 schema still lacks normalized customers, quote/invoice line items, payment ledger/partial-payment allocation, credit-note allocation, and job assignment/status history. Do not represent these as operational until schema/API changes are implemented and tested.
- Public quote/enquiry submission remains disabled in V4 because the existing intake Worker is bound to production D1. Create and test a separate preview intake Worker and Turnstile configuration before enabling it.

## Next steps

1. Complete the browser-only visual and Cloudflare Access/API checks above.
2. Keep using synthetic preview data and the preview-specific API/D1/R2 only.
3. Keep the current production website available as rollback; do not merge/promote or alter the public domain as part of preview testing.
4. Continue to use Cloudflare free-tier services only while the R0 monthly-cost requirement remains in force.


---

## Staging environment update — 29 October 2026

### Created and verified via Cloudflare API
- Isolated preview Worker `ngms-admin-api-preview` using the existing admin Worker code; inspected source confirms CORS allowlist for `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev` and the earlier intended `https://ngms-rebuild-preview.vercel.app` origin.
- Separate Cloudflare Access application `NGMS Rebuild Preview API` with the same single-administrator allow policy; Worker JWT validation remains enabled.
- Separate D1 database `ngms-admin-preview` (UUID `f12c5c48-58cd-4c48-82de-8c7341b8e6cf`) with the five inspected table shapes.
- Separate R2 bucket `ngmsmedia-preview`, bound to the staging Worker.
- Four synthetic QA fixtures in staging D1 only (enquiry, job, draft quote, sent invoice), all clearly tagged as preview-only. No production data was copied or changed.
- Frontend create/status/media helper functions and forms exist, but `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false` and writes remain disabled. The current Cloudflare build configuration supplies the dedicated preview API base; it does not enable write actions.
- Admin module screens include create forms for enquiries, jobs, quotations and invoices; explicit status options; a media upload control; and an authenticated media open/download link. API URL pinning and a direct Access health/sign-in link are implemented. The read path and media download still require an authorized human-browser test; no write or upload persistence test has been run.

### Pending / blocked
- A Vercel preview now exists, but the project remains on the Cloudflare Workers free-tier path to avoid recurring hosting costs.
- The rebuild is deployed to Cloudflare Workers and has passed the Next.js build, Docker build, and route smoke checks. It has not yet been exercised from an authorised human browser session; real Access login, cross-origin browser requests, API reads and R2 upload/read remain not run.
- No public quote submission is enabled; the existing intake Worker shares production D1. A separate staged intake endpoint and Turnstile configuration are required.
- V4 acceptance workflow run #95 has confirmed the dedicated `/icon.svg` smoke test and all three priority route checks after the admin integration code changes: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938100852. This is CI evidence, not browser-level acceptance.
- Desktop/mobile visual inspection, accessibility, performance, full SEO crawl, workflow regression, restore rehearsal and final release checklist are still pending.
