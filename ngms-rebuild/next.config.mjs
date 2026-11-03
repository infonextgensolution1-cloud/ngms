/** NGMS rebuild deployment configuration. Production uses only the production Workers endpoints. */
const previewApiBase = "https://ngms-admin-api-preview.nextgensolarcleaningmaintenancesolutions.workers.dev";
const productionApiBase = "https://ngms-admin-api.nextgensolarcleaningmaintenancesolutions.workers.dev";
const configuredApiBase = process.env.NEXT_PUBLIC_NGMS_API_BASE;
const isProduction = process.env.VERCEL_ENV === "production" ||
  process.env.NEXT_PUBLIC_NGMS_ENV === "production";
const deploymentMode = isProduction ? "production" : "preview";
const apiBase = isProduction
  ? (configuredApiBase || productionApiBase)
  : (configuredApiBase || previewApiBase);

const previewIntakeUrl = "https://ngms-public-intake-preview.nextgensolarcleaningmaintenancesolutions.workers.dev";
const productionIntakeUrl = "https://ngms-public-intake.nextgensolarcleaningmaintenancesolutions.workers.dev";
const previewTurnstileSiteKey = "0x4AAAAAAFxoO4FZHHYoj_ov";
const productionTurnstileSiteKey = "0x4AAAAAAFqT3LsT7hZV8jFb";
const configuredIntakeUrl = process.env.NEXT_PUBLIC_NGMS_PUBLIC_INTAKE_URL;
const configuredTurnstileSiteKey = process.env.NEXT_PUBLIC_NGMS_TURNSTILE_SITE_KEY;
const intakeUrl = isProduction
  ? (configuredIntakeUrl || productionIntakeUrl)
  : (configuredIntakeUrl || previewIntakeUrl);
const turnstileSiteKey = isProduction
  ? (configuredTurnstileSiteKey || productionTurnstileSiteKey)
  : (configuredTurnstileSiteKey || previewTurnstileSiteKey);

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  env: {
    NEXT_PUBLIC_NGMS_ENV: deploymentMode,
    NEXT_PUBLIC_NGMS_API_BASE: apiBase,
    NEXT_PUBLIC_NGMS_PUBLIC_INTAKE_URL: intakeUrl,
    NEXT_PUBLIC_NGMS_TURNSTILE_SITE_KEY: turnstileSiteKey,
    NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES:
      process.env.NEXT_PUBLIC_NGMS_ENABLE_PREVIEW_WRITES || "false",
    NEXT_PUBLIC_NGMS_ENABLE_PRODUCTION_WRITES:
      process.env.NEXT_PUBLIC_NGMS_ENABLE_PRODUCTION_WRITES || "false",
  },
};
export default nextConfig;
