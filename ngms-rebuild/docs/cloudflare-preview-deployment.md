# NGMS Cloudflare preview deployment

**Updated:** 29 October 2026  
**Branch:** `preview/ngms-cloudflare-worker`  
**App root:** `ngms-rebuild/`

## Deployment

- Public preview: https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev
- Worker: `ngms-rebuild-preview-worker`
- Latest verified build: `842272af-9200-4b7d-8231-63145e92d88a`
- Build source commit: `d464ab51a17635677f8530d98c0a2d824e1ae1ea`
- Build result: `success`
- Active Worker version: `498aa4f7-5e0f-4c90-a1c7-3ecdedcc81b2`
- Framework: Next.js 16.4.3 with OpenNext for Cloudflare Workers.
- API base: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Preview write flag: `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`

## Isolation and safety

- The preview is deployed on a dedicated Worker, not the existing Pages project or Vercel `ngms-new` project.
- Admin API preview bindings point to the preview D1 database and `ngmsmedia-preview` R2 bucket only.
- The preview API Worker source was inspected directly: its CORS allow-list includes this Worker origin and the earlier intended Vercel preview origin. The `NGMS Rebuild Preview API` Cloudflare Access application has a single-administrator allow policy, and the API Worker binds only the preview D1 and R2 resources.
- The preview branch includes a committed npm lockfile so the Cloudflare build runner's `npm ci` succeeds.
- The existing public domain, production Vercel configuration, production Worker, production D1/R2, and production customer records were not changed by this deployment.

## Verification boundary

Cloudflare's build logs confirmed the Next.js build, OpenNext bundle, static asset upload, and Worker deployment succeeded. Latest repository CI passed TypeScript validation, the no-Supabase guard, Next.js build, Docker build, and HTTP 200/content-marker smoke tests for all three V4 pages: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40904904067

A full interactive browser check of Cloudflare Access authentication and admin API requests has not been completed because direct resolution/fetching of the workers.dev pages is blocked in the validation environment. Keep preview writes disabled until those checks and staging persistence tests pass. The temporary CI validation PR #276 was closed without merging.
