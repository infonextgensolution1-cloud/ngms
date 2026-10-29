# Temporary NGMS admin route CI trigger

Documentation-only pull request to execute the V4 workflow after adding Docker smoke tests for the admin overview, enquiries and media routes.

- This PR does not change application code.
- The target branch contains the updated smoke-test workflow; it should verify `/admin`, `/admin/enquiries` and `/admin/media` alongside the three priority public routes and `/icon.svg`.
- Do not merge this temporary trigger. Close after recording the CI result.
- The temporary test branch is not a Cloudflare Workers deployment source.
