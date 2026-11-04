# NGMS Cloudflare D1 migrations

These SQL migrations describe the Cloudflare D1 schema used by the NGMS admin API. They use `ngms_schema_migrations` as the application migration ledger and are idempotent where practical.

## Environment safety

- Apply and test against `ngms-admin-preview` first.
- Do not point preview migrations at `ngms-admin`.
- Production migration is a separate release step, following preview acceptance and a verified D1 backup.
- The legacy Supabase migration folder is not the Cloudflare D1 migration source.

## Preview migration history

The isolated preview database currently records migrations 0005, 0006 and 0007–0013.

- 0007 records the existing scheduling table/indexes in the preview migration ledger.
- 0008 creates `operation_records` for maintenance, suppliers, inventory and financial records.
- 0009 adds a partial unique index preventing multiple active invoices per source quotation.
- 0011 adds invoice payment records, enquiry/customer links and quote-to-job source relationships. It also adds the stricter one-invoice-per-quotation index used by the deployed API; a cancelled invoice does not free the quotation for re-invoicing.
- 0012 adds hashed, one-use public quotation links and the quote-to-job uniqueness index.
- 0013 adds media-library categories, alt text, tags and an update timestamp without moving or rewriting existing R2 objects.

Migrations 0011 and 0012 were already present in preview D1 when inspected on 3 November 2026. Migration 0011 already creates the enquiry-to-customer mapping table, so no additional migration is required for CRM conversion. Their SQL files are recorded here to bring the deployed preview schema under version control; **do not replay them against the existing preview database**.

## New environment application order

1. Inspect `ngms_schema_migrations` and `sqlite_master` before applying.
2. Apply missing migrations only, in numeric order.
3. For 0009 and 0011, run duplicate-source preflight queries before creating unique invoice indexes.
4. Confirm the resulting table/index definitions and migration ledger.
5. Never copy synthetic preview rows into production.
6. Apply production only as a separate, explicitly approved release after a verified backup and preview acceptance.
