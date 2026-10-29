# NGMS V4 — Blueprint-to-Acceptance Matrix

**Updated:** 29 October 2026  
**Branch:** `preview/ngms-cloudflare-worker`  
**Application root:** `ngms-rebuild/`  
**Purpose:** Trace NGMS requirements to implementation and evidence so a successful build is not mistaken for a fully accepted website or admin system.

## Source and interpretation rule

This matrix is reconstructed from the recorded NGMS requirements, the implementation notes, the backend contract and the Cloudflare deployment record. A single signed-off, canonical master blueprint file was **not independently identified** during this review. Therefore, this is a traceable acceptance baseline—not proof that every line of a separately maintained blueprint has been matched. New or changed requirements must be added here before production release.

Status meanings:

- **PASS — evidence verified:** the specific criterion has concrete evidence. It does not imply the whole feature or release is accepted.
- **PARTIAL — implemented, acceptance incomplete:** some code or UI exists, but end-to-end or visual acceptance remains outstanding.
- **BLOCKED — intentionally disabled or unsafe to accept:** a prerequisite is missing; do not turn it on to make a demo appear complete.
- **PENDING — not yet verified:** no sufficient test evidence is recorded.
- **PLANNED — not evidenced as implemented:** keep out of release claims until built and tested.

## 1. Brand, delivery and production boundary

| ID | Requirement / acceptance criterion | Current status | Evidence available | Exit criteria |
|---|---|---|---|---|
| BP-01 | Preserve the existing public website while V4 is built separately. | **PASS** | The public alias `www.nextgensolarmaintenance.co.za` still maps to the existing Vercel deployment; V4 is on its dedicated Cloudflare `workers.dev` preview. Existing PR [#274](https://github.com/infonextgensolution1-cloud/ngms/pull/274) remains open and unmerged. | Keep the production alias and production data untouched. PR #274 is not release approval; do not merge or cut over until all mandatory release checks pass and production release is explicitly approved. Recheck the alias before cutover. |
| BP-02 | NGMS industrial identity: black, white and orange; consistent logo, typography and calls to action. | **PARTIAL** | Brand styles, embedded brand mark, navigation and shared page shell exist in `ngms-rebuild/`. | Compare every target page with the approved brand/reference screenshots in desktop and mobile browsers; record visual sign-off. |
| BP-03 | Separate V4 code and preview backend; do not depend on Supabase. | **PASS for source/deployment separation and current V4 CI check** | The isolated app records no Supabase SDK/client. V4 acceptance CI run #80 passed the source/lockfile/dependency-tree guard and dependency audit. | Keep production legacy Supabase issues separate from V4 acceptance; rerun the guard for future code changes. |
| BP-04 | Stay within the R0/monthly additional-cost requirement using free-tier services where practical. | **PARTIAL** | Cloudflare Workers preview is deployed; preview D1/R2 resources are separate. | Verify current account plan, quota, billing alerts and any paid services/connectors before launch. Free-tier intent is not a promise that usage can never incur cost. |
| BP-05 | Mobile-responsive, accessible public website and admin interface. | **PARTIAL** | Responsive styles and mobile navigation/CTA exist; CSS contains focus and `.skip-link` styling. The rendered skip link and real-browser keyboard behavior have not been independently verified. | Browser-check at 320, 375, 768, 1024 and desktop widths; test keyboard-only navigation, zoom, labels, contrast, screen-reader basics and WCAG 2.2 AA issues. |

## 2. Public website and services

| ID | Requirement / acceptance criterion | Current status | Evidence available | Exit criteria |
|---|---|---|---|---|
| WEB-01 | Homepage, navigation, footer, contact paths and clear quote/contact calls to action. | **PARTIAL** | Shared public shell and homepage are included in the implementation record. | Exercise all internal links, phone/email/WhatsApp actions and mobile navigation in a real browser. Check for 404s and dead ends. |
| WEB-02 | Solar Panel Cleaning page follows the supplied reference direction. | **PARTIAL** | Route is generated in the deployed build; previous CI route smoke test asserted HTTP 200 and the `SOLAR PANEL CLEANING` marker. | Visually compare against the supplied reference screenshot; confirm images, spacing, page copy, service links, CTA destinations and FAQ interactions. |
| WEB-03 | Maintenance Packages page and plan/quote paths. | **PARTIAL** | Route is deployed; previous CI smoke test asserted HTTP 200 and `PLANNED`. The public form is preview-only/disabled. | Verify cards, plan wording, mobile layout and quote-path selection; ensure disabled forms clearly state what happens next. |
| WEB-04 | Body Corporate Maintenance page and customer/committee contact path. | **PARTIAL** | Route is deployed; previous CI smoke test asserted HTTP 200 and `CORPORATES`. | Visually review service cards, process, plan language and CTA; test the form destination without creating production records. |
| WEB-05 | Service directory and individual service detail pages. | **PARTIAL** | Implementation notes record 12 service-category cards and service detail templates. | Check each expected service slug, copy accuracy, images, metadata, navigation and 404 behavior against the final service inventory. |
| WEB-06 | Service-area pages for Strand, Gordon's Bay, Somerset West and surrounding Helderberg areas. | **PARTIAL** | Implementation notes record area pages and a Helderberg solar page. | Verify the approved location list, unique accurate copy, internal links and contact/quote paths; avoid unsupported claims about service coverage. |
| WEB-07 | Portfolio, before-and-after galleries and completed-work showcases. | **PARTIAL** | Portfolio/gallery UI and stored media concepts are present. Two existing solar marketing images were imported as general imagery, not represented as verified customer-project evidence. | Use only approved customer/project media with permissions and accurate captions; validate image loading, categories, replacement and empty/error states. |
| WEB-08 | Contact, About, FAQ, pricing, privacy, terms and supporting content pages. | **PARTIAL** | These templates/routes are recorded as present. | Review all copy, prices, contact details, policy wording and SEO metadata with the business owner; test links and legal text before release. |
| WEB-09 | Page speed, SEO parity and production URL mapping. | **PENDING** | Next.js/OpenNext build completes; full SEO crawl, performance test and route parity review remain outstanding. | Verify title/description/canonical/robots, sitemap/robots rules, redirect map, structured data, image performance and mobile Core Web Vitals. Preview currently has `robots: noindex,nofollow`; change release metadata deliberately only when launch is authorised. |

## 3. Enquiries, quotes and public lead generation

| ID | Requirement / acceptance criterion | Current status | Evidence available | Exit criteria |
|---|---|---|---|---|
| LEAD-01 | Customer can submit an enquiry with service, job description, contact details and preferred date. | **BLOCKED** | Public submissions are disabled. Existing intake Worker is bound to production D1, so using it for V4 tests could contaminate production data. | Create a dedicated preview intake Worker and Turnstile configuration; test validation, spam controls, errors and persistence using synthetic data. |
| LEAD-02 | Allow maintenance enquiries to include photos/attachments. | **BLOCKED** | R2/media pieces exist, but end-to-end public attachment submission is not accepted or enabled. | Define size/type limits, private storage and safe file handling; test upload, validation, failure recovery and record linkage in preview. |
| LEAD-03 | Enquiry is recorded in admin and can progress into a job/quotation workflow. | **PARTIAL** | Read-only admin client and backend collections exist; create helpers/UI are feature-gated and preview writes remain off. | Verify a synthetic enquiry appears in the authorised admin session and progresses through the approved status transitions without touching production data. |
| LEAD-04 | Quotation request, quotation preparation and customer follow-up. | **PARTIAL** | Quote routes/templates and a document collection concept exist; writes and full business flow are not accepted end to end. | Confirm quote fields, numbering, line items, validity, VAT/tax treatment, totals, PDF, email/WhatsApp draft, approval and follow-up rules with real business requirements. |
| LEAD-05 | Enquiry confirmation and outbound customer communication. | **PLANNED / PENDING** | No verified end-to-end email, WhatsApp or customer-notification acceptance evidence is recorded. | Configure approved delivery provider(s), privacy controls, message templates, retry/error tracking and human approval; test with owned test addresses/numbers. |

## 4. Admin dashboard and operational modules

| ID | Requirement / acceptance criterion | Current status | Evidence available | Exit criteria |
|---|---|---|---|---|
| ADM-01 | One secure, mobile-friendly admin dashboard with overview of enquiries, jobs, quotations, invoices and outstanding work. | **PARTIAL** | Responsive admin shell, preview-host-pinned API client, direct Access health/sign-in link and read-only collection client are implemented. CI run #95 passed typecheck/build/Docker and route smoke checks; actual authenticated API reads and count reconciliation remain untested. | Complete authorised-browser acceptance, reconcile displayed counts to preview D1 and verify loading/empty/error states. No fabricated or stale KPI claims. |
| ADM-02 | Manage enquiries and customer details. | **PARTIAL** | Enquiries collection exists; current schema does not establish a complete normalized customer-management model. | Confirm customer identity/contact schema, deduplication, consent, search, edit, export and audit/history needs before declaring customer management complete. |
| ADM-03 | Create and manage jobs, assignments, status and history. | **PARTIAL** | Job collection and feature-gated helpers/forms are recorded. Current schema lacks assignment and status-history capabilities noted as outstanding. | Specify job lifecycle and transitions, assignee, scheduling, evidence/photos, status history, permissions and validation; test persistence and concurrency. |
| ADM-04 | Create/manage quotations and invoices. | **PARTIAL** | Documents collection and preview forms/helpers are recorded. Current schema does not yet provide normalized quote/invoice line items, payment ledger, partial-payment allocation or credit-note allocation. | Design and test document numbering, line-item arithmetic, taxes, discounts, deposits, payments, partial payments, balances, credit notes, PDF generation and status audit. |
| ADM-05 | Media library: upload, organise, preview, search, categorise and replace images/documents. | **BLOCKED for end-to-end acceptance** | Preview R2 bucket/API exists; media list/search and a host-restricted Worker open/download link are implemented. CI #95 checks type/build only; real-browser Access/download has not passed, uploads and other writes remain disabled, and the schema has no category field. | Test authorised upload/list/preview/replace/delete/download with synthetic files; add an approved categorisation model; enforce size/type rules, private access, error handling and recovery. |
| ADM-06 | Website content, services and gallery can be updated without a developer. | **PARTIAL** | Content collection and feature-gated helper/UI pieces are recorded. Browser write persistence is untested; flag remains disabled. | Demonstrate an authorised edit, validation, preview/review, persistence, rollback and audit trail using preview-only content. |
| ADM-07 | Calendar, reporting, settings and business performance indicators. | **PLANNED / UNAVAILABLE** | Implementation notes explicitly mark calendar, reporting and settings unavailable until contracts are implemented. | Define requirements and data sources; implement and validate before advertising these as operational features. |

## 5. Backend, security and automation

| ID | Requirement / acceptance criterion | Current status | Evidence available | Exit criteria |
|---|---|---|---|---|
| SEC-01 | Preview data is isolated from production data and media. | **PASS for configured bindings** | Preview API bindings point to `ngms-admin-preview` D1 and `ngmsmedia-preview` R2; synthetic fixtures are marked preview-only; no production data was copied. | Re-read bindings and database targets before any future migration or release. Keep synthetic and production records separated. |
| SEC-02 | Admin API protected by Cloudflare Access and server-side JWT validation. | **PARTIAL** | Separate Access application/single-administrator policy and JWT validation are configured and source/bindings were inspected. Admin screens now link to the preview API health/sign-in endpoint and block requests to unapproved API hosts. | Sign in from the intended browser; test allowed/denied sessions, expiry, CORS preflight and API reads. Configuration inspection alone is not end-to-end proof. |
| SEC-03 | Uploads and media remain private and safe. | **PARTIAL** | Managed public R2 `r2.dev` is disabled; no bucket public domain/CORS configuration is recorded; access is expected through Worker routes. | Test authenticated media access, reject unauthenticated access, validate MIME/extension/size, prevent path/key abuse and review logging/retention. |
| SEC-04 | Preview writes are protected by a deliberate feature gate. | **PASS for current configuration; write behavior not tested** | `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`; create/status/media controls remain disabled. | Keep disabled until SEC-02 and ADM-03–06 tests pass; enable only in preview for controlled synthetic persistence tests, never for production by default. |
| SEC-05 | Backups and restore/recovery are documented and tested. | **PENDING** | Restore rehearsal and final release checklist remain outstanding. | Document D1/R2 backup/export and recovery steps, retention, access and recovery objectives; perform and record a restore rehearsal. |
| AUTO-01 | Automate enquiry triage, missing-information checks, reply drafts, job creation and follow-ups with human approval. | **PLANNED / NOT VERIFIED** | The workflow is a recorded NGMS goal, but no end-to-end running agent/workflow is evidenced by the V4 acceptance records. | Map each trigger/action, approval gate, retry path, secrets, audit logs, human override and duplicate prevention; test against synthetic data. |
| AUTO-02 | Integrate WhatsApp, email or Zapier/other external connectors only when approved and configured. | **PENDING** | No end-to-end connector test evidence is established by this matrix. | Verify connected account, scopes, costs, secrets, failure handling and test delivery; do not claim integration merely because a connector is available. |

## 6. Test and deployment evidence

| ID | Check | Current status | Evidence / limitation |
|---|---|---|---|
| TEST-01 | Cloudflare production build and deployment for V4 preview. | **PASS** | Build `e05f302a-3339-4a72-b223-49b5f357f6b5` succeeded for commit `221af794990af37c1bb7a7c11f52d8df1bda0105`; Worker version `f09552d0-8541-4bc8-a7ea-053a182bd6b7` is assigned 100% of preview Worker traffic. |
| TEST-02 | Previous GitHub Actions CI checks for three priority routes. | **PASS for that recorded run** | Run https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40904904067 passed dependency audit, TypeScript, Supabase guard, Next.js, Docker and three route/content-marker smoke tests. |
| TEST-03 | Latest CI run including `/icon.svg` and the admin integration changes. | **PASS for CI/build checks** | V4 acceptance CI run #95 passed: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938100852. Dependency audit, TypeScript, Supabase guard, Next.js build, Docker build and HTTP 200 marker tests for all three priority pages plus `/icon.svg` passed. This was triggered by a documentation-only PR against the latest preview base; it does not test human-browser Access/CORS/media behavior. |
| TEST-04 | Production domain unchanged. | **PASS at last check** | `www.nextgensolarmaintenance.co.za` still maps to the existing production Vercel deployment. Recheck before any future cutover. |
| TEST-05 | Interactive visual checks, real browser Access/API/media flow. | **PENDING** | Not independently completed; the current tool environment could not directly fetch the `workers.dev` preview pages. |
| TEST-06 | Latest preview favicon correction. | **Build PASS; live browser confirmation pending** | The sampled 404 was `/favicon.ico`; adding `app/icon.svg` produced a generated `/icon.svg` route and the successful Worker build uploaded the icon asset. Fresh browser verification is not recorded. |
| TEST-07 | Repository-wide production build gate. | **PASS for build/release-gate workflow only** | GitHub Actions run https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40923404076 completed successfully. Its workflow is a build check, not a deployment. The existing V4-to-main PR remains unmerged. | Recheck the production alias and obtain explicit release approval before any PR merge or routing change. |

## 7. Release gate — do not declare V4 production-ready until all mandatory items pass

- [ ] A canonical blueprint or approved requirements baseline is linked and reconciled against this matrix.
- [x] V4 acceptance workflow run #95 passed dependency audit, typecheck, Supabase guard, application build, Docker build and all three priority route plus icon smoke tests against the current admin integration base: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938100852.
- [ ] Visual review signed off for all public pages at required viewport sizes.
- [ ] Route, links, metadata, SEO/robots, redirect and performance checks completed.
- [ ] Cloudflare Access sign-in, allow/deny, session expiry, CORS preflight and admin API reads validated in a real browser. The UI has an API health/sign-in link, but this still requires browser proof.
- [ ] Synthetic preview create/update workflows and read-after-write verification completed; production resources untouched.
- [ ] Media upload, preview, replace, deletion and download verified with permissions and file validation. The current UI exposes an authenticated media open/download link; it has not been end-to-end tested.
- [ ] Separate preview intake and Turnstile path tested before public enquiry/attachment submission is enabled.
- [ ] Quote/invoice data model, calculations, PDFs and payment/credit-note behavior accepted for actual NGMS business rules.
- [ ] Data backup/restore rehearsal and security/privacy review completed.
- [ ] Customer communications and automations tested with approval gates, retries, audit trail and duplicate prevention where required.
- [ ] Current Cloudflare plan/usage/cost reviewed against the R0 requirement.
- [ ] Explicit production release decision and rollback steps documented.

## Decision

**Current release state: PREVIEW ONLY — NOT APPROVED FOR PRODUCTION.**

The three priority pages and isolated Cloudflare deployment are verified at build/deployment level, and earlier route smoke tests passed. The whole blueprint, admin/media workflows, public submissions, browser-level security tests and production readiness are not yet accepted. Treat each row's status independently; do not infer acceptance of an entire module from a route rendering or build passing.

## Related records

- [Implementation status](implementation-status.md)
- [Admin panel integration and browser verification guide](admin-panel-integration.md)
- [Backend contract and security boundaries](backend-contract.md)
- [Cloudflare preview deployment](cloudflare-preview-deployment.md)
- [CI workflow](../../.github/workflows/ngms-rebuild-ci.yml)
