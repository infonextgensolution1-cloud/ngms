# NGMS Workflow A — Enquiry to accepted quotation to job

**Scope:** Isolated NGMS V4 preview only. This document describes the intended and partially implemented workflow. It is not production release approval.

## Customer journey

1. Customer opens the public **Request a Quote** page at `/quote`.
2. Customer selects a service, provides contact details and site area, describes the work, optionally selects a preferred date and completes Cloudflare Turnstile.
3. The browser submits to the dedicated preview intake Worker at `POST /api/public/enquiries`. The Worker validates required fields, checks Turnstile, processes the honeypot and submission key, detects near-duplicate submissions and writes an enquiry to preview D1.
4. The customer sees a receipt message. The form does not issue a formal quotation or automatically send an email/WhatsApp message.

## Admin journey

5. An authorised NGMS administrator opens Admin → Enquiries and reviews the new enquiry.
6. The administrator selects **Add to CRM**. The preview API links the enquiry to an existing CRM customer where one exact email or normalised phone match is found, or creates a CRM customer when there is no match. More than one match is rejected for manual resolution. The conversion is mapped through the existing `enquiry_customer_links` table so a retry returns the same customer.
7. The administrator prepares the formal quotation in the existing Quotations module: select the CRM customer, enter itemised work lines, quantities, units and ZAR unit prices, then apply any discount, VAT setting and notes. The quotation is saved as Draft; saving does not contact the customer.
8. The administrator selects the originating enquiry for that same CRM customer and chooses **Approve & issue quotation**. The API verifies the customer/enquiry relationship, changes the quote to Sent, expires any previous unused link and creates a new high-entropy 30-day one-use decision link. The API stores only the SHA-256 token hash in D1.
9. The administrator reviews the link and copies it or opens a pre-filled WhatsApp message. Sending is manual; the system does not send customer communications automatically at this stage.

## Customer decision and job creation

10. The customer opens `/quote/[token]`. The page requests only the quote bound to that token and displays the itemised lines, charges, discount, VAT (when enabled), total and notes.
11. The customer chooses Accept or Decline. The public endpoint is routed through the narrowly scoped Cloudflare Access application for `/api/public/quotes/*`; no admin endpoints are included in that bypass. The Worker validates the token hash, expiry, quote state and source enquiry/customer relationship.
12. On **Accept**, a D1 batch records the quote as Accepted, consumes the token, creates one job linked to the CRM customer and quotation using `jobs.source_document_id`, marks the enquiry Converted and writes customer activity. A unique index on `jobs.source_document_id` protects against duplicate job creation. The API returns the job reference and the customer confirmation displays it.
13. On **Decline**, the decision is recorded and the token consumed. No job is created.
14. Repeated or expired token submissions are rejected. Admin quotation lists include the linked job ID when one exists.

## Existing components reused

- Formal quotations and invoices: `/api/admin/commercial-documents` and `document_line_items`.
- CRM customers and activity: `customers`, `customer_activity`.
- Enquiry conversion map: `enquiry_customer_links` (already included by migration 0011).
- One-use quotation links: `quote_public_links` (already included by migration 0012).
- Job source link and unique guard: `jobs.source_document_id` and the existing unique partial index.
- Public request protection: Cloudflare Turnstile and preview intake Worker.

No additional D1 schema migration was needed for Workflow A; the required tables and uniqueness constraints are already in migrations 0011 and 0012.

## Preview deployment record — 3 November 2026

- Preview API Worker `ngms-admin-api-preview`: version 51, deployed at 100% preview traffic.
- Preview Public Intake Worker `ngms-public-intake-preview`: version 38, deployed at 100% preview traffic. Its CORS allow-list includes the isolated Cloudflare preview website origin. Production intake CORS was not modified.
- Cloudflare Access app `NGMS Preview Public Quote Decisions`: Bypass/Everyone policy only for `ngms-admin-api-preview.../api/public/quotes/*`. The wider admin API Access application remains protected.
- Frontend source changes: draft PR #283. GitHub rebuild CI passed dependency audit, TypeScript, Supabase guard, Next.js build, Docker build and route smoke tests. Frontend changes have not yet been promoted to the active frontend preview.
- Admin writes remain disabled with `NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false`.

## Acceptance tests still required

- [ ] Use the actual preview website in a browser and submit a synthetic enquiry with a valid Turnstile challenge.
- [ ] Verify the public form CORS preflight and successful preview D1 write.
- [ ] Sign in to preview Admin through Cloudflare Access and verify that the enquiry appears.
- [ ] Convert one synthetic enquiry to CRM; verify the mapping, customer and activity. Repeat the action and confirm no duplicate.
- [ ] Prepare an itemised quote with test amounts and independently verify subtotal, discount, VAT and total.
- [ ] Issue the quote against its originating enquiry; verify the link and quote status.
- [ ] Open the customer link in a signed-out/private browser; verify quote details load without admin Access sign-in.
- [ ] Accept a test quote; verify exactly one job, quote Accepted, enquiry Converted, link consumed and customer activity recorded.
- [ ] Replay the same token; verify conflict/no second job.
- [ ] Decline a separate test quote; verify no job exists for that quote.
- [ ] Verify expiry and invalid-token handling.
- [ ] Confirm the admin Quotations view displays the created job reference.
- [ ] Test the admin Access allow/deny/session-expiry behaviour.
- [ ] Keep the feature flag off until the browser QA and read-after-write tests pass.

## Production boundary

Do not merge PR #283, change production DNS, alter the live Vercel project, or deploy the preview Worker to the production Worker. Production release requires the remaining acceptance tests, business-owner sign-off and an explicit release decision.