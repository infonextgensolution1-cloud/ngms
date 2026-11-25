# NGMS HostAfrica rebuild — implementation status

**Updated:** 14 November 2026  
**Branch:** `feat/hostafrica-native-ops-rebuild`  
**Application root:** `ngms-rebuild/`  
**Target:** `nextgen.getmaintenance.co.za`  
**Release state:** staging source and build validation in progress; not deployed to HostAfrica.

## Verified build evidence

- The isolated Next.js app has completed GitHub Actions dependency installation, TypeScript validation and Next.js production build on earlier branch revisions.
- The branch includes a dedicated workflow `.github/workflows/ngms-hostafrica-native.yml` that regenerates the lockfile, runs `npm ci`, `npm run typecheck`, `npm run build` and verifies that runtime source/configuration does not contain Supabase or Cloudflare dependencies.
- The most recent changes (Operations Manager, homepage slides, media optimisation and financial guardrails) require the latest run to finish before those changes can be marked build-verified. Check the branch's GitHub Actions before release.

## Implemented in source

### Public website
- NGMS Solar Forge brand shell, navigation and responsive site styling.
- Homepage, service directory and service detail templates, areas, body corporate, pricing, packages, about/contact/FAQ, portfolio, gallery and before/after routes.
- Public quote request form connected to same-origin enquiry API.
- Published project and media display from the central media library.
- Editable homepage carousel with up to 12 active slides.

### Business Operations Manager
- Protected admin login and one-time owner bootstrap.
- Dashboard metrics for enquiries, jobs, open quotations, invoice balances, recorded payments, paid expenses, maintenance due and low stock.
- CRM customers and enquiries, formal quotations, invoices, payment ledger, jobs and schedules.
- Suppliers, materials, purchases, expenses, staff profiles, subcontractors, wage records and maintenance plans.
- Project Manager with before/after attachments and publish/unpublish/archiving.
- Website content drafts, separate owner/admin publication review and rollback.
- Audit logging for privileged writes.

### Media Manager
- Upload multiple photographs and PDFs, assign categories, optimise images to WebP when the browser can create a smaller image, and validate size/MIME/signature on the server.
- Edit category, alt text and tags; replace; publish; private preview; delete checks for project references.
- HostAfrica filesystem storage outside `public_html`, with metadata in MySQL.
- Homepage carousel can select an image from the Media Manager.

## HostAfrica account observations

- HostAfrica reports an active DirectAdmin hosting service for `getmaintenance.co.za`.
- The `nextgen` A record already points to the account server.
- HTTP returned 200 for `http://nextgen.getmaintenance.co.za`.
- HTTPS returned a certificate for `da43.host-ww.net`, not `nextgen.getmaintenance.co.za`; the target subdomain certificate needs to be installed in DirectAdmin.
- The connected HostAfrica account API can inspect domain and DNS records but does not expose DirectAdmin's Node.js application manager, MySQL database creation, file manager, SSH/SFTP deployment or per-domain SSL controls.

## Remaining before staging acceptance

1. In DirectAdmin create a separate MySQL/MariaDB database and user for the new subdomain.
2. Create a Node.js 22 application with root outside `public_html`; set the environment variables from `.env.example`.
3. Configure persistent `MEDIA_ROOT` outside `public_html`.
4. Transfer `ngms-rebuild/` to the Node app, run `npm install`, `npm run db:migrate`, `npm run build`, and start/restart using `server.cjs`.
5. Install a valid TLS certificate for `nextgen.getmaintenance.co.za` and verify HTTPS before enabling redirects.
6. Create the owner account through the one-time `/setup` flow.
7. Test real browser login, media upload/replace/publish, public enquiry, quote acceptance/decline, invoice payment, job conversion, reports, operations modules, mobile layout, backups and restore.
8. Only after acceptance should the owner consider a separate production cutover.

No live website or existing staging site has been modified. No DNS changes, MySQL provisioning, host filesystem changes, SSL changes or customer-data migration have been performed through the connected HostAfrica integration.
