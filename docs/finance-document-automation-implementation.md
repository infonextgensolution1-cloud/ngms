# NGMS Finance, Documents & Operations Automation — Implementation Plan

Status: Phase 1 audit completed; implementation work is confined to `feature/finance-doc-automation`.
Production merges, production migrations, live customer messaging, and irreversible data changes are out of scope without explicit approval.

## Confirmed decisions
- Supabase is the system of record and primary file store.
- Google Drive is a synchronised secondary archive.
- OCR/classification runs automatically, but extracted financial data must be reviewed and approved before posting.
- Financial and operational reports are required.
- Admin and customer portal must follow the approved black / warm-grey / off-white / orange industrial design system.

## Phase sequence
1. Audit schemas, RLS/policies, storage buckets, app routes, Vercel configuration and external integrations.
2. Add a document registry, extraction/review queue, Drive sync queue, audit events and material movement foundation using additive migrations.
3. Implement upload, metadata extraction, validation, duplicate detection, review/approval and idempotent posting APIs.
4. Connect Drive archive synchronisation after the owner connects the intended Drive account and approves folder permissions.
5. Extend management reports using approved source transactions and provide export/archive support.
6. Run build, schema, access-control, duplicate/retry, reconciliation, mobile and end-to-end tests on preview/staging; do not merge to production until explicitly approved.

## Audit findings (2026-10-17)
- Repository: `infonextgensolution1-cloud/ngms`; Next.js app; feature branch created from `main`.
- Existing report implementation: `lib/admin-report.ts`; it currently parses payments from invoice notes using a regex, so structured payment records should be the long-term source of truth. Avoid treating note text as an authoritative ledger.
- Existing document route: `app/api/admin/client-documents/route.ts`; uses `client-documents` bucket, staff guard and client/quote association checks.
- Production Storage buckets observed: `before-after-photos`, `gallery-photos`, `hero-slides`, `job-photos`, `public-leads`, `purchase-receipts`, `quotes`, `site-media`, `worker-documents`. The `client-documents` bucket was not present in that production bucket listing, although the existing upload route uses it. This is a likely production upload mismatch that must be verified and corrected in a controlled migration.
- Staging has a private `client-documents` bucket, 15 MiB limit and allowlisted document MIME types.
- Staging Supabase security advisor reports RLS disabled on `public.clients` and `public.quotes`. Do not auto-apply RLS changes: design and test policies against the app's actual access paths first.
- Production advisor shows four RLS-enabled tables with no policies: `client_portal_access`, `job_subcontractor_assignments`, `subcontractor_invitation_drafts`, `subcontractor_job_reports`. Confirm their intended service-role/server-side access paths and portal requirements before policy changes.
- Existing tables already cover clients, quotes, quote items, invoices, invoice items, jobs, materials, suppliers, supplier purchases, job costs, labour entries, client documents, quote versions, credit notes and completion reports. Reuse them; do not create parallel customer/quote/invoice systems.
- Existing `lib/admin-report.ts` calculates month reports from invoices, invoice note payment lines, quotes, completed jobs, job costs, labour, supplier purchases and leads. Verify calculations for double counting and period semantics before expanding.
- Google Drive app is discoverable in Zapier but not currently enabled in the inspected action list. Connection/authentication and folder permissions remain pending. No Drive writes were made.
- Vercel project `ngms-new` is configured for Next.js; observed latest deployment state was READY. A READY deployment is not proof that all workflows pass.

## Target architecture
- Supabase Postgres: canonical metadata, extraction/review states, transaction links, material movements, sync state and audit events.
- Supabase Storage: private original documents and generated artifacts.
- Google Drive: secondary archive; each file maps back to one stable Supabase document ID.
- Admin APIs: authenticated staff-only server-side routes. No service-role key in client bundles.
- OCR: provider adapter, schema-validated extraction, confidence/validation warnings; never auto-post based solely on OCR.
- Posting: approval required, idempotency key unique, corrections represented by reversal/adjustment rather than silent mutation.
- Reports: use posted/approved records, clearly separate invoices issued from receipts collected and supplier invoices from payments made.
- Customer portal: only released documents and photos linked to that customer/project; supplier costs and internal reports remain staff-only.

## Folder taxonomy
- 01 Finance: sales invoices, receipts, supplier invoices, expenses, reconciliation, VAT/accountant exports.
- 02 Customers: customer records, enquiries, quotes, approved correspondence.
- 03 Projects: job cards, project photos, inspections, completion reports, project cost summaries.
- 04 Suppliers and Materials: purchase orders, delivery notes, receipts, catalogue, stock movements.
- 05 Subcontractors: agreements, assignments, reports, split calculations, approvals.
- 06 Management Reports: monthly financial reports, operations KPIs, lead conversion.
- 07 Solar Forge and Technical: prompts, agent handoffs, policies, QA, release records.
- 08 Audit and Archive: corrections, approvals, closed periods.
Folders must be created idempotently. Do not use customer names as the sole key; include stable IDs and date/document numbers.

## Required acceptance tests
1. Staff-only upload rejects unauthenticated/non-staff requests.
2. File type, size, filename and content validation; private storage by default.
3. Document is searchable by customer, project, supplier, type, issue date and document number.
4. OCR extraction never posts financial data until an authorised approval.
5. Duplicate upload and retry do not duplicate posting or Drive files.
6. Rejected extraction can be corrected and resubmitted with history retained.
7. Material receipt/issue/return updates ledger once and reconciles to approved purchase/project costs.
8. Drive outage leaves Supabase record intact and retries visibly.
9. Customer portal cannot access other clients' documents, supplier invoices, internal costs or management reports.
10. Monthly totals reconcile to source records; invoice values, receipts and payables remain distinct.
11. PDF/CSV exports carry report date range, generated timestamp, currency (ZAR) and calculation basis.
12. Preview build, mobile layout, keyboard/focus, contrast and relevant WCAG 2.2 AA checks pass.

## Explicit non-goals until separately approved
- Applying migrations to production.
- Enabling RLS without tested policies.
- Posting or reversing real financial transactions.
- Sending live WhatsApp/email messages.
- Uploading customer/supplier documents to Google Drive before account and sharing permissions are confirmed.
- Merging or deploying the feature branch to production.
