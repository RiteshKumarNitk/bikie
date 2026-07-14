import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  transpilePackages: [
    "@bikie/database",
    "@bikie/auth",
    "@bikie/services",
    "@bikie/validation",
    "@bikie/types",
    "@bikie/ui",
    "@bikie/utils",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "i.pravatar.cc", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      // Superseded by the /partners/* public site (ADR-012) — kept for any
      // existing inbound links/SEO.
      { source: "/become-a-partner", destination: "/partners", permanent: true },
    ];
  },
};

export default nextConfig;
