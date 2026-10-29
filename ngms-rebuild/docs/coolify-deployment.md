# NGMS rebuild: Coolify deployment plan

**Purpose:** deploy the fresh Next.js website/admin through Coolify while retaining Cloudflare for the preview API, D1 data and R2 media.
**Dedicated Coolify source branch:** `preview/ngms-coolify`
**Application directory:** `ngms-rebuild/`

## What is prepared

- `Dockerfile` builds the Next.js application using the committed `package-lock.json`.
- The image runs the standard Next.js Node server on `0.0.0.0:3000`.
- The runtime image uses production-only npm dependencies.
- A container health check requests the homepage.
- `.dockerignore` excludes local secrets, dependency folders, Git metadata and generated build output from the Docker build context.
- Build-time public environment variables are configured as Docker build arguments.
- The preview API URL is the default, and preview writes default to `false`.
- GitHub Actions runs dependency audit, typecheck, Supabase dependency checks, Next.js build and Docker image build on this branch.
- This branch is deliberately separate from `preview/ngms-cloudflare-worker`, which is configured for Cloudflare Workers Builds. The Coolify branch is not included in that Cloudflare frontend build trigger.

## Coolify application settings

Create an Application from the GitHub repository `infonextgensolution1-cloud/ngms`.

- Branch: `preview/ngms-coolify`
- Base Directory: `/ngms-rebuild`
- Build Pack / strategy: Dockerfile
- Dockerfile Location: `/Dockerfile`
- Exposed Port: `3000`
- Domain: use the generated Coolify domain first, then configure a dedicated preview hostname.
- Build-time variable: `NEXT_PUBLIC_NGMS_API_BASE=https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Build-time variable: `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`

Because `NEXT_PUBLIC_*` values are embedded into browser JavaScript during the Next.js build, ensure the values are available at build time in Coolify—not only at container runtime.

## Backend and media

Keep the Cloudflare preview API, preview D1 database and `ngmsmedia-preview` R2 bucket as the preview backend. Once Coolify has assigned the actual hostname, add that exact origin to the preview API CORS allow-list and validate Cloudflare Access sign-in from a real browser. Do not point this branch at production records.

## Infrastructure requirement

Coolify is a deployment control panel, not the server that runs the application. A Linux VPS is required. Coolify's official documented minimum for its own control plane is 2 CPU cores, 2 GB RAM and 10 GB free disk; the same machine will also need room for the website image, build process and logs. A 4 GB RAM server is a safer starting point for running Coolify and building a Next.js app on the same host.

Budget for the VPS separately from the free self-hosted Coolify software. You remain responsible for server security updates, firewall and SSH hardening, backups, monitoring, and recovery.

## Cutover rules

- Keep the current production website and domain unchanged while testing.
- Do not point `www.nextgensolarmaintenance.co.za` at Coolify during preview.
- Do not enable preview writes until authentication, CORS and persistence checks pass.
- Keep the existing Cloudflare frontend preview as a rollback/reference path until the Coolify deployment is successfully tested.
- Do not promote preview resources to production until the Docker deployment and backend integration are verified.
