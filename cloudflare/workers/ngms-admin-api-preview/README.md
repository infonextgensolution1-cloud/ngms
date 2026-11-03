# NGMS admin API preview Worker

This folder records the source and non-secret binding configuration for the isolated preview Worker only.

- Worker: `ngms-admin-api-preview`
- D1: `ngms-admin-preview`
- R2: `ngmsmedia-preview`
- Browser origin: `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev`

Cloudflare Access remains the authentication boundary. Configure `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` as Worker secrets; never put their values in this repository. Use a preview-only Access application/policy. Do not reuse these bindings for the production Worker.

The source includes the preview application CORS origin, formal commercial-document routes, and the single-active-invoice-per-source-quotation check. A matching partial unique index is defined in `cloudflare/migrations/0009_commercial_invoice_source_guard.sql`.

Deploy from this directory with the Cloudflare account already selected and the two Access secrets configured:

```bash
npx wrangler deploy --config wrangler.jsonc
```

This configuration must never be used for `ngms-admin-api` or the production D1/R2 resources.
