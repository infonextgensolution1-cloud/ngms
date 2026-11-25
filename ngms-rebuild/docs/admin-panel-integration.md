# NGMS HostAfrica Operations Manager integration

**Updated:** 14 November 2026  
**Branch:** `feat/hostafrica-native-ops-rebuild`  
**Application root:** `ngms-rebuild/`  
**Target staging domain:** `nextgen.getmaintenance.co.za`  
**Status:** HostAfrica-native application source implemented in an isolated GitHub branch. Not yet deployed to DirectAdmin.

## Architecture

- Next.js App Router, React, TypeScript and Tailwind.
- HostAfrica DirectAdmin Node.js application runtime.
- HostAfrica MySQL/MariaDB business database.
- Private media files stored on the HostAfrica filesystem outside `public_html`.
- Same-origin Next.js route handlers for public enquiries and authenticated admin actions.
- First-party NGMS staff sessions, role checks, scrypt password hashes and audit records.
- No Supabase SDK, Supabase Auth, Supabase Storage, Cloudflare Workers, D1, R2, Access or Turnstile in the isolated `ngms-rebuild/` runtime.

## Implemented admin modules

- Overview dashboard with live collection counts and reports.
- Enquiries and CRM customers.
- Formal quotations and invoice documents with line items, discounts and VAT fields.
- Quotation sharing through one-use customer links, acceptance/decline and job creation.
- Invoice payment allocation with balance calculation, overpayment prevention and paid-status reconciliation.
- Jobs and calendar/schedule records.
- Media Library with multiple-file uploads, upload-time category selection, browser-side WebP optimisation where smaller, alt text, tags, replacement, publication and linked-project deletion protection.
- Project Manager with project details and before/after photo associations.
- Homepage Carousel editor, with maximum 12 active slides, content/CTA editing, ordering, activation/deactivation and image selection from Media Library.
- Suppliers, materials/stock, purchases, expenses, staff profiles, subcontractors, wage records and recurring maintenance plans.
- Website content drafts, owner/admin publication review and rollback records.
- Reporting for enquiries, active jobs, open quotes, invoice balances, payment receipts, expenses, maintenance due and low-stock items.

## Authentication and role handling

- First administrator is created through one-time `/setup` using server-side `NGMS_SETUP_TOKEN`.
- Staff login is at `/login`; sessions are stored in MySQL and signed with `SESSION_SECRET`.
- Cookies are HttpOnly, SameSite=Strict and Secure in production.
- Administrative reads and mutations require an active staff session with owner, admin or manager role.
- Only owner/admin roles can approve or roll back website publication.
- A publication requester cannot approve or reject their own publication request.
- Public customer quote decisions use unguessable, expiring, one-use tokens; raw tokens are not stored in the database.

## Media storage rules

- Files are written to `MEDIA_ROOT`, an absolute persistent directory outside `public_html`.
- Media metadata is stored in MySQL.
- Images and PDFs are signature-checked and size-limited server-side.
- Published public images are served through `/api/media/[id]`; private previews/downloads require an admin session.
- Publishing a project publishes linked project photos; archiving/unpublishing removes public visibility unless another published project uses the same media.
- Replacing/deleting is not a backup strategy: the host-level backup schedule must include the private media directory and database.

## HostAfrica deployment remains a separate release step

The HostAfrica account API confirmed the DirectAdmin hosting service and DNS record, but does not expose application manager, database creation, file transfer or SSL controls. Before deployment, create the separate staging MySQL database/user, Node.js app, secure environment variables and persistent media path in DirectAdmin, then install the correct TLS certificate for `nextgen.getmaintenance.co.za`.

The current HTTPS endpoint presented a certificate for `da43.host-ww.net`, not the new subdomain. Do not force HTTPS or treat the host as ready until a certificate for the target hostname is installed and verified.

No production domain, existing staging site, DNS record or live customer database was changed by this rebuild work.
