# NGMS Credit Note Workflow — Implementation Plan

Status: design/acceptance criteria only. No invoice or payment data is changed by this document.

## Objective
Add a formal, auditable credit-note workflow to the admin invoice detail page. Do not treat voiding an invoice or reversing a payment as a substitute for issuing a credit note.

## Accounting safeguards
- Issued invoices remain immutable source records; never delete issued invoices.
- Credit notes are separately numbered records and must reference exactly one original invoice and client.
- Require a non-empty reason and an amount greater than R0.00.
- Credit amount must not exceed the original invoice's remaining creditable amount after previous credit notes; enforce this server-side/transactionally, not only in the browser.
- Preserve VAT treatment and line-item basis from the original invoice. VAT-registered status/rate must be resolved from NGMS settings and validated; do not infer registration from a UI checkbox.
- A credit note must not rewrite historical payments. Payment refunds/reversals remain a distinct audited operation.
- Do not automatically mark an invoice paid, delete it, or silently reduce its paid_amount when a credit note is issued. Define and test the accounting effect before enabling issuance.
- Draft invoice deletion remains limited to unpaid drafts. Existing void restrictions remain intact.

## Proposed data model
Create a dedicated `credit_notes` table with:
- UUID primary key
- unique sequential `credit_note_number` (CN-0001 format, allocated safely under concurrent requests)
- `invoice_id` foreign key to `invoices` (restrict deletion)
- `client_id` foreign key to `clients`
- status (draft/issued/void)
- reason, subtotal, VAT amount, total amount, created_at, issued_at, created_by
- optional audit metadata; never store payment card/banking credentials

Create `credit_note_items` with a foreign key to the credit note, description, quantity, unit, unit price, VAT basis, and line total. Use numeric columns with explicit precision and check constraints. Confirm existing schema conventions before migration.

## Admin UX
- Add a “Credit notes” section to invoice detail.
- Create a draft credit note from an eligible issued invoice, prefilled with source invoice/client and source line items.
- Allow a full or partial credit; show remaining creditable amount and VAT calculation before saving.
- Require reason and a final confirmation before issuing.
- Show status, number, issue date, source invoice link, line items, subtotal, VAT and total.
- Provide a printable PDF-ready credit note document labelled “CREDIT NOTE” (never “INVOICE”), with NGMS business/client details and original invoice reference.
- Provide a visible audit trail for creation, issuance, voiding and any correction; do not offer hard deletion of issued credit notes.

## Security
- Apply RLS consistent with current NGMS staff policies using `private.is_ngms_prompt_user()`.
- Customer portal users must not be able to create, edit, issue or read internal draft credit notes.
- Validate all amounts and relationships in a transactional database function or server-side operation. Prevent duplicate issuance and over-crediting under concurrent requests.

## Required regression tests
1. Valid partial and full credit note, with and without VAT (according to actual business registration settings).
2. Reject zero/negative amount, missing reason, wrong client/invoice linkage and credit above remaining limit.
3. Concurrent attempts cannot exceed the original invoice value.
4. Issued credit notes remain immutable and cannot be deleted.
5. Voided invoices, paid invoices and partially paid invoices follow the explicitly approved accounting rules.
6. Existing invoice void/delete and payment-reversal workflows still work.
7. Credit-note print/PDF layout has correct labels, totals, VAT and original invoice reference.
8. RLS denies customer/non-staff access.
9. Build, lint/type checks, migration review and route-level mobile/desktop QA pass.

## Rollout
- Implement on this feature branch only.
- Inspect the actual production schema and permissions before finalizing migration.
- Open a draft PR and use its preview for manual review.
- Do not merge, deploy manually, or modify live invoice/payment records without explicit approval.
- Before enabling issuance, obtain confirmation of how credits should apply when the original invoice has already been paid (credit balance/refund versus reducing receivable).
