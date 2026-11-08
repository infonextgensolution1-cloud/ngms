# NGMS public intake preview

This Worker is intended to use only the isolated preview resources configured in `wrangler.jsonc`:

- D1: `ngms-admin-preview`
- R2: `ngmsmedia-preview`

## Required bindings

The preview Worker needs the following secrets/bindings:

- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY` (optional for enquiry persistence; required to send the Resend email notification)
- `LEAD_NOTIFY_TO`
- `LEAD_NOTIFY_FROM`

The current preview Worker has only `TURNSTILE_SECRET_KEY`; `RESEND_API_KEY`, `LEAD_NOTIFY_TO` and `LEAD_NOTIFY_FROM` were not present during the 8 November 2026 audit. Email notifications therefore remain disabled. Do not commit any of these values to Git. Add them only to the isolated preview Worker using the Cloudflare dashboard's secret configuration or the project's approved secret-management workflow. A Wrangler secret write creates and deploys a new Worker version immediately, so verify the preview target before using it.

## Attachment contract

Public enquiries accept up to four optional image attachments (JPEG, PNG, WebP or AVIF), up to 5 MB each and 20 MB total. Uploads are stored under private R2 keys and their metadata is linked through the `enquiry_attachments` D1 table. The admin API exposes attachment metadata and authenticated download URLs.

Apply migration `cloudflare/migrations/0013_enquiry_attachments.sql` to `ngms-admin-preview` only before testing uploads. Do not run it against production as part of this preview change.
