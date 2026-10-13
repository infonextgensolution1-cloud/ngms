# NGMS Public Website Route & Release Audit

Date: 2026-10-13
Repository: `infonextgensolution1-cloud/ngms`
Production baseline commit inspected: `37007f57ec6e00f3a65634c710eaafb4a0131db1`
Working branch: `feat/ngms-public-site-audit-and-service-pages`

## Scope
- Reconcile the requested public service routes with the service catalogue.
- Add a gutter cleaning and maintenance service entry.
- Preserve the established steelwork route while supporting the shorter requested URL.
- Add a scoped responsive industrial-editorial layout to service detail pages.
- Record homepage, directory, route, and PDF environment findings.
- Keep production `main` unchanged until preview verification and explicit user approval.

## Route findings on the baseline preview
- `/`: HTTP 200
- `/services`: HTTP 200
- `/services/solar-panel-cleaning`: HTTP 200
- `/services/painting`: HTTP 200
- `/services/waterproofing`: HTTP 200
- `/services/paving`: HTTP 200
- `/services/plumbing`: HTTP 200
- `/services/electrical`: HTTP 200
- `/services/pool-fibre-lining`: HTTP 200
- `/services/high-pressure-cleaning`: HTTP 200
- `/services/rubble-removal`: HTTP 200
- `/services/handyman`: HTTP 200
- `/services/gutters`: HTTP 404 before this branch
- `/services/steelwork`: HTTP 404 before this branch
- Existing `/services/steelwork-welding`: HTTP 200
- Existing `/services/subcontractor-work`: HTTP 200

## Changes in this branch
1. Add the `gutters` service record with specific scope, FAQs and SEO metadata.
2. Resolve aliases for `steelwork`, `gutter-cleaning`, and `gutter-cleaning-maintenance` to canonical service records.
3. Permanently redirect alias URLs to canonical routes from the service detail page.
4. Add scoped service-page editorial CSS: dark industrial hero, oversized responsive display type, orange accents, square CTA treatment, mobile adjustments and reduced-motion support.
5. Preserve the existing quote form, solar pricing, service catalogue entries, service-area links, trust badges and other service page behaviour.

## Homepage and directory review
The current homepage already composes admin-managed hero slides, project/gallery imagery, featured services, solar content, customer reviews, trust elements, and quote/WhatsApp CTAs. The service directory uses the shared service catalogue and reusable service cards. This change builds on those components rather than replacing the homepage or backend.

## PDF environment finding
Vercel runtime errors from 2026-10-09 through 2026-10-12 reported `/api/quotes/[id]/pdf` failures because the server-side Supabase URL configuration was missing in the affected deployment. The Vercel environment listing shows `NEXT_PUBLIC_SUPABASE_URL` configured for Production, but not a confirmed isolated Preview Supabase URL. Do not copy production credentials or route preview writes to the production database by default. Before preview PDF testing, configure an approved isolated Preview Supabase environment or verify the intended safe environment-variable configuration. Never commit secret values.

## Verification still required
- Vercel preview build must finish successfully.
- Check canonical and alias service routes on the new preview.
- Check the homepage and directory visually at mobile, tablet and desktop widths.
- Test service cards, quote CTAs, form submission, gallery images, WhatsApp links and FAQ readability.
- Verify PDF generation against a safe test quote and an approved non-production data environment.
- Confirm no regressions to existing admin-managed content or backend integrations.
- Production promotion requires explicit user approval: **“Preview approved — deploy live”**.
