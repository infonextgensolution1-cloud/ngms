# NGMS admin API preview Worker

This folder records the source and non-secret binding configuration for the isolated preview Worker only.

- Worker: `ngms-admin-api-preview`
- D1: `ngms-admin-preview`
- R2: `ngmsmedia-preview`
- Browser origin: `https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev`

Cloudflare Access remains the authentication boundary. Configure `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` as Worker secrets; never put their values in this repository. Use a preview-only Access application/policy. Do not reuse these bindings for the production Worker.

The source includes the preview application CORS origin, formal commercial-document routes, invoice payment allocation, 30-day one-use public quotation links, customer accept/decline decisions, and accepted-quote-to-job conversion. The API permits one invoice per source quotation, matching the stricter unique index defined in migration 0011. Preview D1 also contains the payment and quote-link tables recorded in migrations 0011 and 0012.

The admin UI is protected by its separate path-scoped Access app. The API Access app bypasses OPTIONS preflight only; every actual admin API request requires the authorised Access identity and Worker JWT validation. Public quote routes accept only the hashed one-use token and do not expose admin-only endpoints.

Deploy from this directory with the Cloudflare account already selected and the two Access secrets configured:

```bash
npx wrangler deploy --config wrangler.jsonc
```

This configuration must never be used for `ngms-admin-api` or the production D1/R2 resources.
