/** Independent app config; keep the rebuild isolated from the parent workspace. */
const previewApiBase = "https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // These are public configuration values, not credentials. Keep the fallback
  // pinned to the preview API; never point this rebuild at production services.
  env: {
    NEXT_PUBLIC_NGMS_API_BASE:
      process.env.NEXT_PUBLIC_NGMS_API_BASE || previewApiBase,
    // Mutations and uploads stay disabled until browser auth and persistence
    // checks pass against the isolated preview database and media bucket.
    NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES:
      process.env.NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES || "false",
  },
};
export default nextConfig;
