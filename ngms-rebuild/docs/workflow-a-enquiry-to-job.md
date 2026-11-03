# NGMS Workflow A — Enquiry to job

**Status:** Phase 1 intake and the Workflow A UI/backend source are implemented on the isolated feature branch. Preview migration, Worker deployment and end-to-end acceptance tests remain release gates.  
**Production:** No production website, Worker, D1 database, R2 bucket, DNS or Access policy was changed.

## Target workflow

1. Customer submits a quote request on `/quote`.
2. The public intake Worker validates the request and Turnstile token, applies honeypot and duplicate-submission checks, and stores the enquiry in preview D1.
3. An authorised NGMS administrator reviews the enquiry in the Admin Enquiries module.
4. The administrator converts/links the enquiry to a CRM customer and prepares a formal quotation with itemised lines, totals and terms.
5. The administrator approves the quotation for sending. The customer receives a private quotation link/PDF through the approved channel.
6. The customer accepts or declines. Acceptance is recorded against the quotation.
7. An accepted quotation creates one linked job, preventing duplicate job conversion.

The customer never directly creates a job. A formal quotation is not generated or sent automatically from an unreviewed enquiry.

## Phase 1 — Public quote request intake

### Implemented in the feature branch

- Replaced the disabled preview form with a client-side form at `ngms-rebuild/app/quote/page.tsx`.
- Added `QuoteRequestForm.tsx` with service selection, customer name, phone/email, property area, preferred date and work description.
- Added explicit Turnstile rendering using action `ngms_enquiry`.
- Added unique `submissionKey`, honeypot field, client validation, submit state and success/error/reference feedback.
- Service values are mapped to the exact allowlisted values enforced by the public intake Worker.
- Preferred date is preserved in the enquiry details; the current D1 schema has no dedicated preferred-date column.
- No public photo attachments are accepted in this phase.

### Preview-only Cloudflare configuration

- Public intake Worker: `ngms-public-intake-preview`.
- Intake endpoint: `https://ngms-public-intake-preview.nextgensolarcleaningmaintenancesolutions.workers.dev/api/public/enquiries`.
- Preview D1: `ngms-admin-preview` (`f12c5c48-58cd-4c48-82de-8c7341b8e6cf`).
- Preview Turnstile widget: `NGMS V4 Rebuild Preview Enquiry`.
- Public site key: `0x4AAAAAAFxoO4FZHHYoj_ov` (not secret).
- Secret binding `TURNSTILE_SECRET_KEY` is configured only on `ngms-public-intake-preview`; its value is not stored in GitHub or browser code.
- The preview intake Worker allowlist includes `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev`.
- The original production `ngms-public-intake` Worker and production Turnstile widget were not changed.

### Verification still required

- [ ] Cloudflare build/deployment of the feature branch.
- [ ] Confirm site key and endpoint are injected into the client bundle in the deployed preview.
- [ ] Complete Turnstile and submit a synthetic request.
- [ ] Verify the enquiry appears in `ngms-admin-preview`.
- [ ] Verify the same enquiry appears in the authenticated Admin Enquiries module.
- [ ] Test invalid Turnstile, missing required fields, honeypot and duplicate submission.
- [ ] Verify there are no cross-origin or Access issues.

The current environment cannot resolve/fetch the `workers.dev` host directly, so the Worker configuration read-back is verified but browser submission is not yet verified.

## Phase 2 — Administrator review and CRM conversion

The Enquiries module exposes an explicit “Add to CRM” action. The preview Worker conversion route links an enquiry to one exact existing CRM customer match (email or normalised phone), or creates a new CRM customer. An enquiry-to-customer link table makes retries idempotent. Ambiguous matches are rejected for manual resolution. Conversion records customer activity and moves a New enquiry to Contacted.

## Phase 3 — Formal quotation

Use the existing `customers`, `documents`, `document_line_items`, `document_sequences` and `customer_activity` tables. The preview Worker’s commercial-document route already validates customer ownership, line items, discount and VAT settings and allocates a sequential reference. The admin quotation screen must call this commercial route rather than the legacy minimal document route.

Formal quotation requirements:
- Item description, quantity, unit, unit price and line total.
- Discount and VAT settings, with ZAR values stored as integer cents.
- Sequential NGMS quotation reference.
- Draft status until the administrator reviews and approves it.
- PDF/print output and immutable issued content/versioning.
- Human-controlled send action.

## Phase 4 — Customer approval and job creation

The current rebuild quote-token page is intentionally inactive. Implement a separate preview-only, high-entropy, expiring, single-use customer decision token. Store only a token hash in D1. The public page must retrieve only the quotation associated with the token, show the total and terms, and accept a clear Accept/Decline decision.

On acceptance, one atomic or idempotent backend workflow must:
1. Confirm the token is valid, unexpired and unused.
2. Confirm the quotation is still in a sendable status.
3. Record acceptance and timestamp.
4. Create exactly one job linked to the CRM customer and accepted quotation.
5. Mark the originating enquiry as converted.
6. Record customer activity/audit events.

A decline must record the decision without creating a job.

## Communications

The current public intake Worker has notification code but its preview environment has no configured lead-notification recipient/from values. Submission is still recorded in D1; administrators must review it in the protected dashboard. Do not claim automated email notification until an approved recipient, sender and delivery test are configured.

Quotation delivery uses two explicit administrator actions: save an itemised quotation as a private Draft, then approve/issue it to create a 30-day customer link. The interface offers copy-link and a pre-filled WhatsApp compose link. No email or WhatsApp message is sent automatically; a human reviews and sends it.

## Release boundary

This work is preview-only. Do not merge or promote it to the live website until the full acceptance checklist passes and the owner explicitly approves production release.


## Workflow A implementation and preview migration

- Additive migration: `migrations/0002_workflow_a_quote_lifecycle.sql`.
- New table: `enquiry_customer_links` (one CRM customer link per enquiry).
- Extended `quote_public_links`: originating enquiry/customer, decision, decision timestamp and resulting job ID.
- Unique partial index: one job per `source_document_id`.
- The preview Worker source is maintained at `workers/ngms-admin-api-preview/src/index.ts`; deploy only to `ngms-admin-api-preview`.
- Before enabling preview writes: apply the migration to `ngms-admin-preview` only; verify Access sign-in/CORS; submit a synthetic Turnstile enquiry; convert it to CRM; create and issue an itemised quote; test Accept, Decline, expiry and replay; verify exactly one job and the enquiry status in preview D1.
- Production Worker, production D1, production R2, live domain and DNS remain out of scope.
