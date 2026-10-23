# Supabase replacement — migration plan

Status: Phase 1 audit complete. This branch is intentionally isolated from `main`; no production data, credentials, migrations, or live services have been changed.

## Executive finding

Supabase is not just the photo bucket in this codebase. It currently provides:
- Staff sign-in, session persistence, and MFA assurance checks.
- The primary PostgreSQL data store for leads, clients, quotes, invoices, jobs, labour, costs, reports, settings, posts, service images, gallery images, and homepage slots.
- Storage for public website images and private job/client/worker/quote documents.
- Server-side data access used by admin APIs and MCP endpoints.

Removing the Supabase SDK or changing only the Media panel would break these workflows. Replacement must be staged and verified before any Supabase resources are retired.

## Proposed target

- **Admin identity:** Auth.js with a supported identity provider and enforced staff allow-list/roles; MFA policy must be retained or improved.
- **Photo/object storage:** Cloudflare R2, private by default. Public website media should be served through a controlled public custom domain; private job/client documents should use short-lived signed URLs.
- **Database:** PostgreSQL on Neon (or another managed PostgreSQL provider) with reviewed schema migrations, backups, and least-privilege access. Do not choose a database only for the media panel: existing business data and server-side workflows must migrate together.
- **Application:** Next.js server routes for privileged operations; no storage or database secrets in client bundles.
- **Cutover:** dual-read/validation where appropriate, object inventory and checksum validation, staged preview, rollback window, then retire Supabase only after acceptance.

## Inventory from repository audit

| Area | Current dependency | Migration concern |
|---|---|---|
| Admin authentication | Supabase Auth; `hooks/useAdminAuth.ts` | Preserve staff access, session handling, MFA, and API-side authorization. |
| Public site content | Supabase Postgres via `lib/queries.ts` | Hero slides, gallery, before/after, posts, service images and homepage slots need a replacement source. |
| Media panel | Supabase Storage and metadata tables in `app/admin/media/page.tsx` | Upload, URL generation, metadata updates, ordering, slots, deletion and cleanup must all migrate. |
| Job photos | Supabase Storage; job records in database | Keep project/job association and photo visibility rules. |
| Client/quote documents | Server routes, staff guard, database and private buckets | Private access, short-lived links, client isolation and file associations must remain intact. |
| Operations | Shared Supabase client/service-role access in `lib/ngms-ops/core.ts`, AI routes and MCP routes | Broad data/API dependency; not safe to remove until every query and mutation is migrated. |
| Privacy content | `app/privacy/page.tsx` | Update the named processor only after the new provider is live and policy reviewed. |

## Required phases

1. **Audit and freeze scope** — inventory every Supabase import, table, bucket, policy, trigger, scheduled task, webhook, and external integration. Record data volumes and access patterns.
2. **Build the replacement foundation** — configure Auth.js, PostgreSQL, migrations, R2 buckets/domains, environment variables, logging, backups, and server-side authorization. Use staging resources first.
3. **Migrate the Media panel** — implement server-mediated upload/list/delete and metadata persistence; preserve existing media slots and public URLs or provide redirects. Keep private assets private.
4. **Migrate business data and routes** — migrate and reconcile content, leads, clients, quotes, invoices, jobs, costs, documents, AI endpoints, scheduled tasks and MCP endpoints. Replace all Supabase reads/writes and auth checks.
5. **Verify and cut over** — run build/type checks, automated access tests, upload/download tests, record-count and checksum reconciliation, preview/UAT, rollback rehearsal, and production monitoring. Remove the Supabase dependency and credentials only when no runtime path uses them and the owner approves retirement.

## Acceptance checklist

- [ ] Admin login, logout, role checks and MFA policy verified.
- [ ] All existing Media panel tabs, uploads, updates, ordering and deletions work.
- [ ] Public pages render the same active hero/gallery/service photos.
- [ ] Private quote/job/client/worker files cannot be read by unauthorised users.
- [ ] Database counts and key business totals reconcile.
- [ ] Scheduled tasks, integrations and MCP routes pass end-to-end tests.
- [ ] Backup, rollback and incident procedures documented.
- [ ] Production owner signs off before Supabase is disabled or deleted.

## Configuration needed before staging implementation

Create the replacement resources and provide environment variables through the hosting provider's encrypted environment settings (never commit secrets):
- Auth.js secret and the chosen identity provider's credentials.
- PostgreSQL connection string for the replacement database.
- Cloudflare account/bucket name, R2 access key ID, R2 secret access key, endpoint, and public media domain (if public media is intended).
- Preview/staging deployment access and a safe data export/backup path.

No credentials should be placed in this repository. Existing Supabase credentials should remain active during migration and be removed only after cutover approval.
