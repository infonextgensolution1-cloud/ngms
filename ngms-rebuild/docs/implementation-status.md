# Implementation status

Date: 29 October 2026.

## Added to isolated branch
- Created branch rebuild/ngms-cloudflare-first from the repository main branch.
- Added an independent Next.js app under ngms-rebuild.
- Added the proposed NGMS black, white, warm-neutral and orange design tokens and responsive patterns.
- Added a homepage, service directory, 12 service pages, and support content templates.
- Added the admin overview and modules for enquiries, jobs, quotations, invoices, calendar, media, content, reports and settings.
- Ensured the new package manifest does not include the Supabase SDK.
- Disabled real submissions and record operations until the real Worker/auth contract is verified.

## Not yet verified
- Dependencies installed and typecheck run.
- Next.js production build.
- Cloudflare Worker routes, authentication, D1 and R2 resources.
- Real record persistence, permissions, upload/download, backups and restore.
- Browser visual regression at 320, 375, 768, 1024 and desktop widths.
- Vercel preview deployment.
- Public-route SEO, performance and accessibility audits.

## Blocker
The connected Vercel integration returned 403 when asked to inspect ngms-website-v4 source. Vercel team authorisation is needed to inspect that earlier preview. The new isolated branch can continue independently.
