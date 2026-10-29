# NGMS Cloudflare-first rebuild

An isolated Next.js application scaffold for rebuilding the public website and branded business-control dashboard without a Supabase runtime dependency.

## Included
- Branded public homepage and reusable public shell.
- Service directory, 12 service detail routes, and the Helderberg solar cleaning route.
- Public templates for contact, about, portfolio, maintenance plans, body corporates, pricing, FAQ, privacy and terms.
- Responsive admin shell with overview and core module interfaces.
- Truthful backend-pending states: no fake live metrics or records.

## Run locally
    npm install
    npm run dev

## Verify
    npm run typecheck
    npm run build

## Boundaries
- This app lives in its own subdirectory so it can be built as an independent Vercel project with root directory ngms-rebuild.
- No production domain, DNS, aliases, production variables, database or customer data are changed by these files.
- The app has no Supabase dependency.
- Enquiry submission, admin authentication, persistence and R2 management remain disabled until the real API contract is verified.
- Do not attach the live public domain or promote to production without separate approval.
