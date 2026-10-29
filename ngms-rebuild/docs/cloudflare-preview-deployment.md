# NGMS Cloudflare preview deployment

**Date:** 29 October 2026  
**Branch:** `preview/ngms-cloudflare-worker`  
**App root:** `ngms-rebuild/`

## Deployment

- Public preview: https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev
- Worker: `ngms-rebuild-preview-worker`
- Build: `6b862796-27b9-4d9a-b72d-6e44ca07e905`
- Build result: `success`
- Framework: Next.js 16.4.3 with OpenNext for Cloudflare Workers.
- API base: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Preview write flag: `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`

## Isolation and safety

- The preview is deployed on a dedicated Worker, not the existing Pages project or Vercel `ngms-new` project.
- Admin API preview bindings point to the preview D1 database and `ngmsmedia-preview` R2 bucket only.
- The preview API CORS allow-list includes this Worker origin and the earlier intended Vercel preview origin.
- The preview branch includes a committed npm lockfile so the Cloudflare build runner's `npm ci` succeeds.
- The existing public domain, production Vercel configuration, production Worker, production D1/R2, and production customer records were not changed by this deployment.

## Verification boundary

Cloudflare's build logs confirmed the Next.js build, OpenNext bundle, static asset upload, and Worker deployment succeeded. Repository CI also passed: https://github.com/infonextgensolution1-cloud/ngms/actions/runs/40836868528

A full interactive browser check of Cloudflare Access authentication and admin API requests has not been completed from the deployment tool environment. Keep preview writes disabled until those checks and staging persistence tests pass.
