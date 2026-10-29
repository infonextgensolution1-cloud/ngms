# NGMS Cloudflare preview deployment

**Updated:** 29 October 2026  
**Branch:** `preview/ngms-cloudflare-worker`  
**App root:** `ngms-rebuild/`  
**Acceptance checklist:** [V4 blueprint-to-acceptance matrix](v4-acceptance-matrix.md)

## Deployment

- Public preview: https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev
- Worker: `ngms-rebuild-preview-worker`
- Latest verified build: `e05f302a-3339-4a72-b223-49b5f357f6b5`
- Build source commit: `221af794990af37c1bb7a7c11f52d8df1bda0105`
- Build result: `success`
- Active Worker version: `f09552d0-8541-4bc8-a7ea-053a182bd6b7`
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

Cloudflare's latest build logs confirmed the Next.js build, OpenNext bundle, static asset upload, and Worker deployment succeeded. It generated `/icon.svg`, uploaded the branded icon asset and activated Worker version `f09552d0-8541-4bc8-a7ea-053a182bd6b7` at 100% traffic. Runtime telemetry found one `/favicon.ico` 404 in the sampled 24-hour window; `app/icon.svg` has now been added to resolve the missing branded icon and was included in the successful build.

The previously confirmed repository CI run passed TypeScript validation, the no-Supabase guard, Next.js build, Docker build, and HTTP 200/content-marker smoke tests for all three V4 pages: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40904904067. The latest V4 acceptance workflow run #80 also passed the dependency audit, TypeScript, Supabase guard, Next.js build, Docker image build and HTTP 200/content-marker smoke tests for all three priority pages plus `/icon.svg`: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40922977824. It was run via a documentation-only PR against the current preview branch; PR #277 was closed unmerged.

A full interactive browser check of Cloudflare Access authentication and admin API requests has not been completed because direct resolution/fetching of the workers.dev pages is blocked in the validation environment. Keep preview writes disabled until those checks and staging persistence tests pass. Temporary CI-validation PRs #276 and #277 were closed without merging.
