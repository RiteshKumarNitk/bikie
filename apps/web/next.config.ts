import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Reasonable-default CSP (no nonces — see Next's CSP guide, "Without Nonces" section): this
// app has `revalidate`-cached and statically-generated routes throughout (bikes/destinations
// search, etc., see API.md), and nonce-based CSP forces every page into dynamic rendering,
// which we don't want. Fonts (Geist Sans via `geist/font/sans`, Inter via `next/font/google`)
// are self-hosted at build time by next/font — no fonts.gstatic.com/googleapis.com needed.
// Images come from Cloudinary (uploads, see /api/upload) plus a handful of stock-photo hosts
// already allow-listed in `images.remotePatterns` below, some of which are referenced via
// plain <img> tags (not next/image) — https: is kept broad in img-src for that reason.
// MSG91 Widget SDK (ADR-034, web OTP) loads a script from verify.msg91.com (falling back to
// verify.phone91.com) and makes its own send/verify calls directly from the browser to MSG91 —
// our backend never sees that leg. Domains here are a starting allow-list based on the vendor's
// documented script URLs; the widget's exact runtime network origins weren't confirmed from
// renderable docs and need to be captured from the Network tab on first live test, then this
// list tightened/corrected to match reality rather than guesswork.
const msg91WidgetScriptSrc = "https://verify.msg91.com https://verify.phone91.com https://hcaptcha.com https://*.hcaptcha.com";
const msg91WidgetConnectSrc = "https://verify.msg91.com https://verify.phone91.com https://control.msg91.com https://hcaptcha.com https://*.hcaptcha.com";
// LocationPicker.tsx/PartnersMap.tsx (ADR-036) use Leaflet (npm-bundled, served from our own
// origin) + raw OpenStreetMap raster tiles instead of Google Maps JS SDK — no API key, no
// billing account. No script-src/connect-src additions needed: Leaflet ships no external script,
// and tile/marker-icon images already fall under the broad `img-src https:` below.
// Razorpay Checkout (ADR-043, membership purchase) — PaymentModal.tsx loads
// checkout.razorpay.com's script only when Razorpay is actually configured server-side (dev-mode
// simulated checkout otherwise never touches this domain at all). Domains match Razorpay's own
// documented CSP guidance: script from checkout.razorpay.com, the payment modal itself runs in
// an iframe from api.razorpay.com, which also fields the SDK's own network calls.
const razorpayScriptSrc = "https://checkout.razorpay.com";
const razorpayConnectSrc = "https://api.razorpay.com https://lumberjack.razorpay.com";
const razorpayFrameSrc = "https://api.razorpay.com https://checkout.razorpay.com";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${msg91WidgetScriptSrc} ${razorpayScriptSrc}${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com;
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com ${msg91WidgetConnectSrc} ${razorpayConnectSrc};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com ${razorpayFrameSrc};
  ${isDev ? "" : "upgrade-insecure-requests;"}
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  // nodemailer opens raw TCP sockets and must stay a real Node require, not a bundled module.
  serverExternalPackages: ["nodemailer"],
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
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Harmless over plain http:// (browsers ignore it there), so safe to send
          // unconditionally rather than branching on environment (ADR-003: local dev is
          // http://localhost:4000).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
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
