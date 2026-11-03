# NGMS Cloudflare preview deployment

**Updated:** 3 November 2026  
**Current isolated preview branch:** `fix/ngms-commercial-documents-preview-20261103`  
**App root:** `ngms-rebuild/`  
**Acceptance checklist:** [V4 blueprint-to-acceptance matrix](v4-acceptance-matrix.md)

## Deployment

- Public preview: https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev
- Worker: `ngms-rebuild-preview-worker`
- Latest Cloudflare Workers Build: `d5f7d7d6-dc1a-497e-a4b4-228455d9d2a4` — **success** (manual build from the isolated feature branch).
- Latest deployment: `fd2ce28d-39f9-43cf-a323-05d5f615ce35`.
- Active Worker version: `5214d3fb-3758-48f3-8adf-650c1853193b` (version 18; 100% of preview traffic).
- Build branch and trigger include only `fix/ngms-commercial-documents-preview-20261103`; app root remains `ngms-rebuild/`.
- Preview API Worker: `ngms-admin-api-preview`, version 49.
- Framework: Next.js 16.4.3 with OpenNext for Cloudflare Workers.
- API base: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`.
- Preview write flag: `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`.
- Framework: Next.js 16.4.3 with OpenNext for Cloudflare Workers.
- API base: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Preview write flag: `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`

## Isolation and safety

- The preview is deployed on a dedicated Worker, not the existing Pages project or Vercel `ngms-new` project.
- Admin API preview bindings point to the preview D1 database and `ngmsmedia-preview` R2 bucket only.
- The preview UI now has a separate `NGMS Rebuild Preview Admin UI` Access application covering the exact `/admin` path and the `/admin/*` subtree. Its Allow policy is restricted to the authorised administrator; the public homepage/service routes remain outside this path-scoped app.
- The preview API Worker CORS allowlist includes this Worker origin. The `NGMS Rebuild Preview API` Access app sets `options_preflight_bypass=true`, bypassing Access only for OPTIONS preflight. All actual API requests remain subject to the preserved single-administrator Access policy and Worker JWT validation. The API Worker binds only preview D1 and R2.
- The preview branch includes a committed npm lockfile so the Cloudflare build runner's `npm ci` succeeds.
- The existing public domain, production Vercel configuration, production Worker, production D1/R2, and production customer records were not changed by this deployment.
- Existing PR [#274](https://github.com/infonextgensolution1-cloud/ngms/pull/274) (“Preview/ngms cloudflare worker”) remains open and unmerged. Do not merge it or change public routing until the mandatory acceptance matrix is complete and production release is explicitly approved.

## Verification boundary

Cloudflare build `d5f7d7d6-dc1a-497e-a4b4-228455d9d2a4` completed successfully from `fix/ngms-commercial-documents-preview-20261103`. It deployed `ngms-rebuild-preview-worker` version `5214d3fb-3758-48f3-8adf-650c1853193b` to 100% of preview traffic under deployment `fd2ce28d-39f9-43cf-a323-05d5f615ce35`. The build included the formal commercial-document UI and the preview-only API integration. The API base remains pinned to `ngms-admin-api-preview`, and preview writes remain disabled. The older deployment above is retained only as historical evidence.

The previously confirmed repository CI run passed TypeScript validation, the no-Supabase guard, Next.js build, Docker build, and HTTP 200/content-marker smoke tests for all three V4 pages: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40904904067. V4 acceptance workflow run #80 passed the same checks plus `/icon.svg`: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40922977824. V4 acceptance workflow run #95 passed after the admin integration changes: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938100852. Latest V4 acceptance run #105 also passed, adding HTTP 200/content-marker checks for `/admin`, `/admin/enquiries` and `/admin/media`: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938991776. Temporary documentation-only CI PRs #276, #277, #278 and #279 were closed unmerged.

The GitHub rebuild CI and root build gate both passed for the current PR. The deployed Worker version and 100% traffic assignment were verified through the Cloudflare API. Direct HTTP/browser access to the `workers.dev` hostnames could not be completed from this validation environment (DNS resolution is unavailable), so a human-browser check of page rendering, Cloudflare Access sign-in, actual CORS preflight, API reads and media download remains required. Preview writes remain disabled until that browser check and a controlled synthetic persistence test pass. The current draft PR is [#283](https://github.com/infonextgensolution1-cloud/ngms/pull/283), open and unmerged.


## Workflow A backend updates — 3 November 2026

- Admin API Worker `ngms-admin-api-preview` version 51 is deployed at 100% of preview traffic. It contains the public quotation decision handler, enquiry-to-CRM conversion, quote issuing bound to an enquiry/customer, and automatic job creation on customer acceptance.
- Public intake Worker `ngms-public-intake-preview` version 38 is deployed at 100% of preview traffic. Its allowed origins include the isolated Cloudflare preview frontend, while production intake configuration remains unchanged.
- Access application `NGMS Preview Public Quote Decisions` applies Bypass/Everyone only to `/api/public/quotes/*`; it does not bypass administrator API routes.
- Frontend Workflow A changes are committed to draft PR #283. The active frontend preview has not yet been rebuilt from those commits. Admin writes remain disabled pending browser QA.
