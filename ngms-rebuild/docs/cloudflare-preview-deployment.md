# NGMS Cloudflare preview deployment

**Updated:** 29 October 2026  
**Branch:** `preview/ngms-cloudflare-worker`  
**App root:** `ngms-rebuild/`  
**Acceptance checklist:** [V4 blueprint-to-acceptance matrix](v4-acceptance-matrix.md)

## Deployment

- Public preview: https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev
- Worker: `ngms-rebuild-preview-worker`
- Latest verified build: `a1887958-1a6d-4256-98a4-4f8bb7e71bfd`
- Build source commit: `d0d39d5c224718b3e3dffa4ceb3975148f9bb79f`
- Build result: `success`
- Latest deployment: `02fe4141-9afb-443b-a1d9-f5deb671127d`
- Active Worker version: `cce817ca-43a9-4872-b72f-80db57bd610e` (100% of preview traffic)
- Framework: Next.js 16.4.3 with OpenNext for Cloudflare Workers.
- API base: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Preview write flag: `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`

## Isolation and safety

- The preview is deployed on a dedicated Worker, not the existing Pages project or Vercel `ngms-new` project.
- Admin API preview bindings point to the preview D1 database and `ngmsmedia-preview` R2 bucket only.
- The preview API Worker source was inspected directly: its CORS allow-list includes this Worker origin and the earlier intended Vercel preview origin. The `NGMS Rebuild Preview API` Cloudflare Access application has a single-administrator allow policy, and the API Worker binds only the preview D1 and R2 resources.
- The preview branch includes a committed npm lockfile so the Cloudflare build runner's `npm ci` succeeds.
- The existing public domain, production Vercel configuration, production Worker, production D1/R2, and production customer records were not changed by this deployment.
- Existing PR [#274](https://github.com/infonextgensolution1-cloud/ngms/pull/274) (“Preview/ngms cloudflare worker”) remains open and unmerged. Do not merge it or change public routing until the mandatory acceptance matrix is complete and production release is explicitly approved.

## Verification boundary

Cloudflare build `a1887958-1a6d-4256-98a4-4f8bb7e71bfd` succeeded for the admin integration source commit `d0d39d5c224718b3e3dffa4ceb3975148f9bb79f`. It uploaded the updated static assets and activated Worker version `cce817ca-43a9-4872-b72f-80db57bd610e` at 100% traffic under deployment `02fe4141-9afb-443b-a1d9-f5deb671127d`. The current source pins the admin API client to the preview host, adds a direct Access health/sign-in link, uses `amount_cents` in the document form payload, requires explicit status selection, and exposes an authenticated media open/download link. The earlier `/favicon.ico` correction remains included.

The previously confirmed repository CI run passed TypeScript validation, the no-Supabase guard, Next.js build, Docker build, and HTTP 200/content-marker smoke tests for all three V4 pages: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40904904067. V4 acceptance workflow run #80 passed the same checks plus `/icon.svg`: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40922977824. Latest V4 acceptance workflow run #95 also passed these checks against the current admin integration base: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40938100852. These temporary documentation-only CI PRs are closed unmerged.

A full interactive browser check of Cloudflare Access authentication and admin API requests has not been completed because direct resolution/fetching of the workers.dev pages is blocked in the validation environment. Keep preview writes disabled until those checks and staging persistence tests pass. Temporary CI-validation PRs #276, #277 and #278 were closed without merging.
