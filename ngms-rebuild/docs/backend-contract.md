# NGMS backend integration contract — proposal only

Status: not implemented or verified. None of the example route shapes below are claimed to exist.

## Proposed architecture
- Public website and admin UI as an independent Next.js app.
- Protected Cloudflare Worker API as the application backend.
- Cloudflare D1 for structured records, subject to resource inventory and approval.
- Cloudflare R2 for media, private by default.

## Data areas
Enquiries and customers; quotes and line items; jobs, assignments, status events and completion evidence; invoices, invoice items and payments; media objects and references; editable public content, service catalogue and audit events.

## Required before connecting write operations
For every resource, document the exact route, method, authentication mechanism, permission, request/response schema, status codes, idempotency behaviour, pagination, validation rules, audit effects and retention.

Minimum failure cases: 401, 403, 404, 409, 422, 429, 500 and timeout/network failure. A failed API call must never be rendered as an empty successful result or zero balance.

## R2 requirements
Verify bucket names, visibility, short-lived access model, allowed content types and limits, checksum, object key strategy, metadata storage, replace/delete behaviour, reference validation, audit record and restoration procedure. Private job/customer files must not become public object URLs.

## Deliberate boundary
This rebuild has no Supabase package, credentials, database adapter or Supabase fallback. Production is untouched. Form submission, admin authentication, record persistence and R2 operations remain disabled until actual Worker and auth contracts are verified.
