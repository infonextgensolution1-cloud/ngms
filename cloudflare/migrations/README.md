# NGMS Cloudflare D1 migrations

These SQL migrations describe the Cloudflare D1 schema used by the NGMS admin API. They use `ngms_schema_migrations` as the application migration ledger and are idempotent where practical.

## Environment safety

- Apply and test against `ngms-admin-preview` first.
- Do not point preview migrations at `ngms-admin`.
- Production migration is a separate release step, following preview acceptance and a verified D1 backup.
- The legacy Supabase migration folder is not the Cloudflare D1 migration source.

## Preview application order

1. Inspect `ngms_schema_migrations` and `sqlite_master` before applying.
2. Apply missing migrations only, in numeric order.
3. For 0009, run the duplicate-source precondition query in the migration comment first.
4. Confirm the resulting table/index definitions and migration ledger.
5. Never copy synthetic preview rows into production.

Migrations 0007 and 0008 reconcile the preview scheduling/operations schema with the deployed Worker API. Migration 0009 prevents more than one non-cancelled invoice from being issued against the same source quotation.
