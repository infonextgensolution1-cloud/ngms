# Temporary NGMS admin integration CI trigger

This documentation-only branch exists only to run the V4 CI workflow against the current admin integration changes on `preview/ngms-cloudflare-worker`.

- App code in this PR is unchanged.
- Verify the API preview-host allowlist, Access sign-in link, document amount-in-cents mapping, explicit status selection, media open/download URL handling and read-only gate through the CI build/type checks.
- This PR must not be merged. Close it after recording test results.
- Cloudflare Workers Builds deploy only from `preview/ngms-cloudflare-worker`; this test branch is not a deployment source.
- Admin integration code under test is from the latest base branch. Route smoke tests validate the build/container routes; they do not simulate an authenticated browser session against the preview API.
