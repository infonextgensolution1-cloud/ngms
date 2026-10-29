# NGMS hosting with R0 monthly hosting cost

**Recommended for now:** use the existing Cloudflare preview deployment instead of Coolify. This avoids buying a VPS or subscribing to a paid hosting plan. This guide covers preview hosting only; it does not authorize a production domain cutover.

## Existing preview deployment

- App branch: `preview/ngms-cloudflare-worker`
- App Worker: `ngms-rebuild-preview-worker`
- Preview URL: https://ngms-rebuild-preview-worker.nextgensolarcleaningmaintenancesolutions.workers.dev
- Preview API: `https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev`
- Preview database: `ngms-admin-preview`
- Preview media bucket: `ngmsmedia-preview`
- Preview writes: disabled by default (`NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES=false)

The Cloudflare Workers Build for commit `fc8a5f00c70761ddbf14d1571e9a58f4b430c114` completed successfully on 29 October 2026. A successful build does not by itself prove that the site works in a real browser; browser, Access authentication, CORS and application-flow checks are still required.

## Why not Coolify right now?

Coolify self-hosted software is free, but it requires a Linux machine/server with ongoing availability. A paid VPS would break the R0 requirement. Do not order a VPS or start a paid Coolify Cloud subscription for this plan.

If a spare Linux machine becomes available later, self-hosting Coolify on it may be an option, but availability, power, internet reliability, security updates, backups and recovery remain the owner's responsibility.

## Free-tier limits to watch

Cloudflare's currently documented Workers Free limits include:
- 100,000 Worker requests per day.
- 10 ms CPU time per Worker request.
- Static asset requests are free and unlimited, but requests invoking server-side Worker code count against the Worker quota.

Cloudflare D1 Free currently includes:
- 5 million rows read per day.
- 100,000 rows written per day.
- 5 GB total storage.

Cloudflare R2 Standard Free currently includes, each month:
- 10 GB-month storage.
- 1 million Class A operations.
- 10 million Class B operations.
- No egress bandwidth charge.

These are usage limits, not a promise that every future feature will remain free at any usage level. Check the account's billing page and usage dashboards regularly. Do not upgrade to a paid Workers plan while the target is R0. If the free limit is reached, requests or database queries may fail until the limit resets.

Official references:
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Static assets billing: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- R2 pricing: https://developers.cloudflare.com/r2/pricing/

## Preview validation checklist

1. Open the preview URL in a normal browser and a mobile browser.
2. Confirm public pages, service pages, contact links and forms render correctly.
3. Confirm the API's read-only paths work from the browser.
4. Complete Cloudflare Access sign-in and check CORS using the actual browser origin.
5. Confirm the preview API and media library use only preview D1/R2 resources.
6. Keep preview writes disabled until authentication and data-isolation checks pass.
7. Review Cloudflare usage and billing before wider testing.

## Production protection

- Do not change DNS for `www.nextgensolarmaintenance.co.za` during preview.
- Do not change production Worker `ngms-admin-api`, production D1 `ngms-admin`, or production R2 `ngmsmedia`.
- Keep current production hosting available as a rollback until the replacement has been fully tested.
- Only discuss production cutover after preview validation, backups and rollback steps are confirmed.
