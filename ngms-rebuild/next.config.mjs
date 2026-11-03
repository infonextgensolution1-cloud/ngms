/** Independent app config; keep the rebuild isolated from the parent workspace. */
const previewApiBase = "https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev";
const configuredApiBase = process.env.NEXT_PUBLIC_NGMS_API_BASE;
const apiBase = process.env.VERCEL_ENV === "production"
  ? (configuredApiBase || "")
  : (configuredApiBase || previewApiBase);

const previewIntakeUrl = "https://ngms-public-intake-preview.nextgensolarcleaningmaintenancesolutions.workers.dev";
const previewTurnstileSiteKey = "0x4AAAAAAFxoO4FZHHYoj_ov";
const configuredIntakeUrl = process.env.NEXT_PUBLIC_NGMS_PUBLIC_INTAKE_URL;
const configuredTurnstileSiteKey = process.env.NEXT_PUBLIC_NGMS_TURNSTILE_SITE_KEY;
const intakeUrl = process.env.VERCEL_ENV === "production"
  ? (configuredIntakeUrl || "")
  : (configuredIntakeUrl || previewIntakeUrl);
const turnstileSiteKey = process.env.VERCEL_ENV === "production"
  ? (configuredTurnstileSiteKey || "")
  : (configuredTurnstileSiteKey || previewTurnstileSiteKey);

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // This public URL is not a credential. The fallback applies only outside
  // Vercel production; production must be configured deliberately.
  env: {
    NEXT_PUBLIC_NGMS_API_BASE: apiBase,
    // Public preview intake endpoint and site key. Production Vercel builds
    // remain disabled unless an approved production intake configuration is supplied.
    NEXT_PUBLIC_NGMS_PUBLIC_INTAKE_URL: intakeUrl,
    NEXT_PUBLIC_NGMS_TURNSTILE_SITE_KEY: turnstileSiteKey,
    // Mutations and uploads remain disabled until preview auth and persistence
    // checks pass against the isolated preview database and media bucket.
    NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES:
      process.env.NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES || "false",
  },
};
export default nextConfig;
