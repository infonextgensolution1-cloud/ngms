# NGMS rebuild: Coolify deployment plan

**Purpose:** provide a standard Docker/Node.js deployment path as an alternative to Vercel and Cloudflare Workers hosting.
**Source branch:** `preview/ngms-cloudflare-worker`
**Application directory:** `ngms-rebuild/`

## What is prepared

- `Dockerfile` builds the existing Next.js application using the committed `package-lock.json`.
- The image runs the standard Next.js Node server on `0.0.0.0:3000`.
- The container uses production-only npm dependencies at runtime.
- A container health check requests the homepage.
- Build-time public environment variables are configured as Docker build arguments.
- The preview API URL is the default, and preview writes default to `false`.

## Coolify application settings

Create an Application from the GitHub repository `infonextgensolution1-cloud/ngms`.

- Branch: `preview/ngms-cloudflare-worker`
- Base Directory: `/ngms-rebuild`
- Build Pack / strategy: Dockerfile
- Dockerfile Location: `/Dockerfile`
- Exposed Port: `3000`
- Domain: use the generated Coolify domain first, then configure the intended preview hostname.
- Build-time variable: `NEXT_PUBLIC_NGMS_API_BASE=https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Build-time variable: `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`

Because `NEXT_PUBLIC_*` values are embedded into browser JavaScript during the Next.js build, ensure the values are available at build time in Coolify—not only at container runtime.

## Backend and media

Keep the current Cloudflare preview API, preview D1 database and `ngmsmedia-preview` R2 bucket as the preview backend. Once Coolify has assigned the actual hostname, add that exact origin to the preview API CORS allow-list and validate Cloudflare Access sign-in from a real browser. Do not point this branch at production records.

## Infrastructure requirement

Coolify is a deployment control panel, not the server that runs the application. A Linux VPS is required. Coolify's official documented minimum for its own control plane is 2 CPU cores, 2 GB RAM and 10 GB free disk; the same machine will also need room for the website image, build process and logs. A 4 GB RAM server is a safer starting point for running Coolify and building a Next.js app on the same host.

Budget for the VPS separately from the free self-hosted Coolify software. You remain responsible for server security updates, firewall and SSH hardening, backups, monitoring, and recovery.

## Cutover rules

- Keep the current production website and domain unchanged while testing.
- Do not point `www.nextgensolarmaintenance.co.za` at Coolify during preview.
- Do not enable preview writes until authentication, CORS and persistence checks pass.
- Do not replace the current preview Worker or promote any preview resources to production until the Docker deployment and backend integration are verified.
