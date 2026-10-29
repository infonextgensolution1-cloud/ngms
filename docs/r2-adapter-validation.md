# R2 adapter validation checklist

This checklist is required before merging the initial R2 storage adapter.

## Dependency integrity
- [ ] Regenerate `package-lock.json` with npm using the updated `package.json`.
- [ ] Run `npm ci`.
- [ ] Run `npm run build` and TypeScript checks.
- [ ] Confirm the Vercel Preview deployment completes successfully.

## Preview-only configuration
Set these variables for Preview only:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME=ngms-media`
- `R2_ENDPOINT` (the exact S3 API endpoint from Cloudflare)

Never put values in source code, issue comments, screenshots, or logs.

## Required implementation before connecting the Media panel
- Add an authenticated server route for upload and verify the existing active-staff authorization server-side.
- Validate MIME type, extension, size, and generated object key on the server; do not trust client-provided paths.
- Add server routes for paginated listing, deletion, and signed download URLs with staff authorization.
- Keep the bucket private. Do not return permanent public URLs for private client/job/quote documents.
- Decide and implement the public-media delivery domain separately from private document delivery.
- Add tests for unauthenticated requests, inactive staff, invalid file types, oversized files, path traversal attempts, and signed URL expiry.
- Confirm the current Media panel's categories, metadata, ordering, slots, and database relationships before switching it off Supabase.

## Cutover guardrails
- Keep Supabase active and retain its credentials until all dependent features are migrated.
- Do not merge/deploy this scaffold to Production until all checks above pass.
- Test uploads, reads, deletes, media rendering, and private-document access in Preview.
- Document rollback steps and get owner approval before Production cutover.
