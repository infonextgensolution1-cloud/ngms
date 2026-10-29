/** Independent app config; keep the rebuild isolated from the parent workspace. */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
};
export default nextConfig;
