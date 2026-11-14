/** NGMS HostAfrica-native Node.js deployment. No third-party Worker or serverless API origins. */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: {
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    formats: ["image/avif", "image/webp"],
  },
  env: {
    NEXT_PUBLIC_NGMS_ENV: "hostafrica",
    NEXT_PUBLIC_NGMS_CMS_WRITES_ENABLED: "true",
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
export default nextConfig;
