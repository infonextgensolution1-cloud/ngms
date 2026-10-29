# Temporary NGMS V4 CI trigger

This documentation-only branch exists solely to run the V4 acceptance workflow against the current `preview/ngms-cloudflare-worker` base.

- No application source is changed by this file.
- The V4 pull-request workflow should run dependency audit, TypeScript, Supabase guard, Next.js build, Docker build, and route/icon smoke tests.
- This test PR must remain unmerged and be closed after the result is recorded.
- Cloudflare Workers Builds are restricted to the preview branch, so this branch is not a V4 deployment source.
