# NGMS rebuild implementation status

**Updated:** 29 October 2026  
**Branch:** `rebuild/ngms-cloudflare-first`  
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
- CI workflow includes npm installation, high/critical dependency audit, TypeScript validation, Supabase source/lockfile/dependency-tree guard and production build.

## Verified Cloudflare inventory (read-only)

- Worker `ngms-admin-api` exists, with D1 binding `DB` and R2 binding `MEDIA`.
- Worker `ngms-public-intake` exists, shares the D1 binding and uses a Turnstile secret.
- D1 database `ngms-admin` exists, UUID `12f7ab7e-adf6-4eb4-a118-29c4ab94cd41`.
- Schema query returned tables: `enquiries`, `jobs`, `documents`, `media`, `site_content`, plus migration/SQLite metadata.
- R2 bucket `ngmsmedia` exists. R2 managed public `r2.dev` is disabled; there are no custom domains or bucket CORS configuration.
- Admin Worker source exposes list/create for enquiries, jobs and documents; list/upload/replace/download/delete for media; GET/PUT for content; plus status updates.
- Public intake source exposes site-content GET and enquiry POST with server validation and Turnstile verification.
- Worker CORS currently allows only `https://ngms-website-v4.vercel.app`. The rebuild preview origin is not yet known/authorised and is not currently verified as allowed.
- Read-only aggregate count on 29 October 2026: enquiries 0, jobs 0, documents 0, media 2, site_content 3. No row-level customer data or media filenames were read for this count check.

See [backend-contract.md](backend-contract.md) for the verified endpoint map, schema details, limitations and security boundaries.

## CI evidence

The completed GitHub Actions run for commit `09691795c79cd2622caf0c520ac6d2315bf6fa0d` passed:
- Dependency security audit
- TypeScript validation
- Supabase-reference guard
- Next.js production build

Evidence: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40801258292

The subsequent logo, solar image, homepage parity and documentation changes trigger another CI run; use the branch's latest Actions run to verify those changes before treating them as checked.

## Explicitly not complete / not verified

- No separate Vercel preview has been deployed yet. The Vercel integration returned 403 while trying to inspect the existing `ngms-website-v4` deployment and create an independent preview project.
- The current Vercel connection needs owner-side team consent before preview creation and deployment inspection can be retried.
- The new read-only frontend API adapter has not yet been exercised from a deployed preview. API base URL remains unset.
- No live API reads, Admin Access login, cross-origin CORS test, record writes, enquiry submission, upload, replacement, download or deletion were executed from this rebuild.
- Do not connect the new preview to the current production intake endpoint for write testing; that endpoint shares the D1 database used by the current backend.
- A dedicated staging API/DB/R2 arrangement and matching Access/CORS rules are needed before enabling live write operations.
- The current D1 schema does not include a normalized customer table, quote/invoice line items, partial-payment ledger, credit-note allocation, or job assignments/status history. Until the schema and reporting definitions are expanded and approved, the UI must not claim to provide those capabilities.
- Browser visual regression at 320, 375, 768, 1024 and desktop widths; full accessibility, performance, security, SEO and route regression audits; migration inventory; backup/restore test and end-to-end business-flow test remain pending.

## Next steps

1. Authorise the Vercel team connection; then create a separate preview project with root directory `ngms-rebuild` and no production domain/alias.
2. Verify deployed preview UI at the required desktop/mobile breakpoints and inspect any build/runtime errors.
3. Implement a staging-specific Worker/D1/R2 and Access/CORS policy, without writes into the production-connected resources.
4. Exercise read-only list endpoints, authentication, empty/error states and private media access using non-production test resources.
5. Implement the approved create/update/media upload flows only after staging tests; run end-to-end enquiry → quotation → job → invoice tests with synthetic data.
6. Review SEO URL parity, WCAG 2.2 AA baseline, performance metrics, security/privacy and backup/restore.
7. Require explicit release-candidate and production approval. Do not merge/promote or change the public domain as part of this work without approval.


---

## Staging environment update — 29 October 2026

### Created and verified via Cloudflare API
- Isolated preview Worker `ngms-admin-api-preview` using the existing admin Worker code with its CORS allowlist changed to `https://ngms-rebuild-preview.vercel.app`.
- Separate Cloudflare Access application `NGMS Rebuild Preview API` with the same single-administrator allow policy; Worker JWT validation remains enabled.
- Separate D1 database `ngms-admin-preview` (UUID `f12c5c48-58cd-4c48-82de-8c7341b8e6cf`) with the five inspected table shapes.
- Separate R2 bucket `ngmsmedia-preview`, bound to the staging Worker.
- Four synthetic QA fixtures in staging D1 only (enquiry, job, draft quote, sent invoice), all clearly tagged as preview-only. No production data was copied or changed.
- Added frontend create/status/media helper functions; UI controls are feature-gated and remain disabled unless `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=true`. That environment flag has not been set.
- Admin module screens now include create forms for enquiries, jobs, quotations and invoices; status editor controls when the feature gate is enabled; and a preview media upload control. These controls are **not enabled in the currently unconfigured app**.

### Pending / blocked
- The connected Vercel integration previously returned 403 while inspecting the older preview and creating the new project. Owner-side Vercel team authorisation is still required.
- No rebuild preview website has been deployed yet and the preview Worker has not been exercised from an authorised browser session. Access login, browser CORS, API reads/writes and R2 upload/read remain not run.
- No public quote submission is enabled; the existing intake Worker shares production D1. A separate staged intake endpoint and Turnstile configuration are required.
- Latest changes after the earlier passing CI run (brand assets, admin forms, preview backend docs/banner) require a fresh CI run; use the latest Actions result before claiming the current branch is green.
- Desktop/mobile visual inspection, accessibility, performance, full SEO crawl, workflow regression, restore rehearsal and final release checklist are still pending.
