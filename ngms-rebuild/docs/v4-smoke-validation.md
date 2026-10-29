# V4 route smoke validation

This is a temporary docs-only change used to trigger the V4 pull-request CI against the preview branch.

Expected automated checks:
- TypeScript validation
- Supabase dependency guard
- Next.js production build
- Docker image build
- Container startup and HTTP 200/content-marker checks for:
  - /services/solar-panel-cleaning
  - /maintenance-packages
  - /body-corporate-maintenance

Do not merge this validation-only branch. It must not change the live website or Cloudflare preview deployment.
