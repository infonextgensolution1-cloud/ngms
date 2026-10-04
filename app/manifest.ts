import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NextGen Maintenance Solutions",
    short_name: "NextGen",
    description: "One Call. All Solutions. Property maintenance across the Helderberg Basin.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B0B0C",
    theme_color: "#0B0B0C",
    orientation: "portrait-primary",
    lang: "en-ZA",
    icons: [
      { src: "/admin-app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/admin-app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/admin-app/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
