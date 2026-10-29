# NGMS rebuild implementation status

**Updated:** 29 October 2026  
**Current preview branch:** `preview/ngms-cloudflare-worker`  
**App root:** `ngms-rebuild/`  
**Production boundary:** no production website, DNS, Vercel production alias, Worker configuration, D1 schema or customer record has been changed by the rebuild work.

## Implemented in the isolated app

- NGMS public shell with the brand's embedded logo, navigation, footer, mobile contact CTA and consistent orange/black/white/warm-neutral styling.
- Homepage, all 12 service category cards and detail templates, service directory, Helderberg solar page, Strand/Gordon's Bay/Somerset West area pages, and templates for contact, about, maintenance plans, body corporates, portfolio, gallery, pricing, FAQ, privacy, terms and solar ROI.
- Imported the verified NGMS logo and two existing solar marketing images into the isolated app. Images are used as general brand/service imagery, not represented as verified customer project evidence.
- Admin navigation and responsive visual shell matching the public brand.
- Read-only admin collection client for currently verified endpoints: enquiries, jobs, documents (quotations/invoices), media and content. The dashboard reads counts/recent records from the API only when configured and reachable; the UI distinguishes a confirmed empty collection from configuration, network, Access, CORS and response errors.
- No false live metrics, customer names, quotation amounts, invoice balances or record writes are simulated. Calendar, reporting and settings remain marked unavailable until their contracts are implemented.
- Compatibility screens for existing quote/maintenance/job-tracking token routes; they do not display tokens or read or mutate private records.
- Next.js 16.4.3 and React/React DOM 19.2.9 in the isolated package; no Supabase SDK or app-side Supabase client.
- CI workflow includes locked dependency installation, high/critical dependency audit, TypeScript validation, a Supabase source/lockfile/dependency-tree guard, a Next.js production build, Docker image build, container start and route smoke tests.

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

See [backend-contract.md](backend-contract.md) for the verified endpoint map, schema details, limitations and security boundaries.

## Current verification evidence — 29 October 2026

The V4 source on `preview/ngms-cloudflare-worker` builds and deploys to the dedicated Cloudflare Worker:

- Cloudflare Workers Build: `842272af-9200-4b7d-8231-63145e92d88a` — **success**, source commit `d464ab51a17635677f8530d98c0a2d824e1ae1ea`.
- Active preview Worker version: `498aa4f7-5e0f-4c90-a1c7-3ecdedcc81b2` (100% traffic on the preview Worker).
- GitHub Actions V4 CI run: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40904904067 — **success** for dependency audit, TypeScript, Supabase guard, Next.js build, Docker build and Docker route smoke tests.
- Docker smoke tests confirmed HTTP 200 and expected page markers for `/services/solar-panel-cleaning`, `/maintenance-packages` and `/body-corporate-maintenance`.
- Vercel preview for source commit `d464ab51a17635677f8530d98c0a2d824e1ae1ea` is also **Ready**, but Cloudflare remains the chosen R0 hosting path.
- Production alias `www.nextgensolarmaintenance.co.za` remains mapped to the existing production Vercel deployment; it has not been switched to V4.

This confirms build/runtime route smoke tests, not full browser acceptance. The tools used for this run could not resolve/fetch the `workers.dev` preview pages directly, so visual regression and real browser authentication/API tests have not been independently completed.

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
- Added frontend create/status/media helper functions; UI controls are feature-gated and remain disabled unless `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=true`. That environment flag has not been set.
- Admin module screens now include create forms for enquiries, jobs, quotations and invoices; status editor controls when the feature gate is enabled; and a preview media upload control. These controls are **not enabled in the currently unconfigured app**.

### Pending / blocked
- A Vercel preview now exists, but the project remains on the Cloudflare Workers free-tier path to avoid recurring hosting costs.
- The rebuild is deployed to Cloudflare Workers and has passed the Next.js build, Docker build, and route smoke checks. It has not yet been exercised from an authorised human browser session; real Access login, cross-origin browser requests, API reads and R2 upload/read remain not run.
- No public quote submission is enabled; the existing intake Worker shares production D1. A separate staged intake endpoint and Turnstile configuration are required.
- Latest changes after the earlier passing CI run (brand assets, admin forms, preview backend docs/banner) require a fresh CI run; use the latest Actions result before claiming the current branch is green.
- Desktop/mobile visual inspection, accessibility, performance, full SEO crawl, workflow regression, restore rehearsal and final release checklist are still pending.
