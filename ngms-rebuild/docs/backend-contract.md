# NGMS HostAfrica application backend contract

**Updated:** 14 November 2026  
**Branch:** `feat/hostafrica-native-ops-rebuild`  
**Base URL:** same-origin Next.js application routes  
**Data store:** dedicated HostAfrica MySQL/MariaDB database  
**File store:** persistent HostAfrica directory outside `public_html`

## Hosting boundary

This contract is for the isolated HostAfrica-native application in `ngms-rebuild/`. It must not call Supabase, Cloudflare services or Vercel APIs.

## Public routes

- `GET /api/health` — verifies database connectivity without returning credentials.
- `POST /api/public/enquiries` — validates and saves a website enquiry; includes honeypot, idempotency key and rate limit.
- `GET /api/public/quotes/:token` — fetches the quotation bound to a valid, unexpired one-use link.
- `POST /api/public/quotes/:token` — records one customer Accept/Decline decision; acceptance creates one job, decline does not.
- `GET /api/media/:id` — serves only media explicitly published for public access.

## Authentication routes

- `GET /api/auth/session` — current staff user.
- `POST /api/auth/login` — verify password and create a signed database-backed session.
- `POST /api/auth/logout` — revoke session.
- `GET /api/setup/admin` — reports whether one-time first-owner setup is available.
- `POST /api/setup/admin` — creates the first owner using server-side `NGMS_SETUP_TOKEN`; unavailable after first setup.

## Administrative collection routes

All `/api/admin/*` routes require an authorised staff session. Mutations are same-origin protected.

- `GET/POST /api/admin/enquiries` — enquiry register and staff-entered enquiries.
- `GET/POST /api/admin/customers` — CRM customers.
- `POST /api/admin/enquiries/:id/convert-to-customer` — link or create a CRM customer from an enquiry.
- `GET/POST /api/admin/jobs` and `PATCH /api/admin/jobs/:id` — job records/status.
- `GET/POST /api/admin/schedules` and `PATCH /api/admin/schedules/:id` — scheduled work.
- `GET/POST /api/admin/commercial-documents?kind=Quotation|Invoice` — formal commercial documents.
- `GET /api/admin/commercial-documents/:id` — document and line detail.
- `PATCH /api/admin/commercial-documents/:id/status` — permitted document status changes; Accepted/Declined decisions must use the customer link; Paid requires full ledger payments.
- `POST /api/admin/commercial-documents/:id/share` — creates a 30-day one-use quotation decision link after validating the customer and originating enquiry.
- `GET/POST /api/admin/commercial-documents/:id/payments` — payment history and payment allocation. Overpayment is rejected.
- `POST /api/admin/commercial-documents/:id/convert-to-job` — accepted quotation to job, with duplicate prevention.
- `GET/POST /api/admin/media` — list and upload media.
- `PATCH /api/admin/media/:id` — media category, alt text, tags and publication metadata.
- `POST /api/admin/media/:id/replace` — replace media object.
- `DELETE /api/admin/media/:id` — delete media only if it is not linked to a project.
- `GET /api/admin/media/:id/file` — authenticated private preview/download.
- `GET/POST /api/admin/projects` — project register.
- `GET/PATCH/DELETE /api/admin/projects/:id` — project details and lifecycle.
- `POST /api/admin/projects/:id/photos` — attach before/after/general media.
- `DELETE /api/admin/projects/:id/photos/:photoId` — detach project photo without deleting the media asset.
- `GET/POST /api/admin/slides` — homepage carousel slides, with server-enforced 12-active-slide maximum.
- `PATCH/DELETE /api/admin/slides/:id` — update slide content/order/status or remove a slide.
- `GET/POST /api/admin/operations/{suppliers|materials|purchases|expenses|staff|subcontractors|wages|maintenance}` — Operations Manager registers.
- `PATCH /api/admin/operations/:module/:id` — status update for an Operations Manager record.
- `GET /api/admin/content` and `PUT /api/admin/content` — website content drafts.
- `GET /api/admin/publishing` — publication requests, published versions and audit.
- `POST /api/admin/publishing/request` — request publication of a saved draft.
- `POST /api/admin/publishing/approve` — owner/admin review; requester cannot approve their own request.
- `POST /api/admin/publishing/rollback` — owner/admin rollback to a prior saved publication.
- `GET /api/admin/reports` — operational, finance, stock and maintenance KPIs.
- `GET /api/admin/settings` — current application configuration summary.

## Database invariants

- Monetary values are stored as integer ZAR cents.
- An invoice is created from an accepted quotation and carries forward its source line items and agreed totals.
- A unique document/source index prevents duplicate invoices from one quotation.
- Invoice payment rows are immutable allocations; amounts above the outstanding balance are rejected.
- An invoice is Paid only when recorded payments cover its full amount.
- A quotation is Accepted or Declined only through its public one-use decision link.
- The customer quote link stores only a SHA-256 token hash, has a 30-day expiry, and can be used once.
- Media files are written outside the public document root and exposed publicly only when marked published.
- Project references prevent deletion of linked media.
- All privileged actions are audited.

## Environment variables

See `.env.example`. Required production variables are `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SESSION_SECRET`, `NGMS_SETUP_TOKEN`, `MEDIA_ROOT`, `APP_BASE_URL` and `PORT`. Keep all secrets in DirectAdmin server-side environment settings, never in Git or browser bundles.
