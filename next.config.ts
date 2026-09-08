import type { NextConfig } from "next";

/**
 * Production security headers.
 *
 * Chosen so that nothing the site actually does gets blocked. Notes on what
 * is deliberately ABSENT are at the bottom — a header that breaks WebGL or
 * the animation clock is worse than no header.
 */
const securityHeaders = [
  // Stops MIME sniffing turning a mistyped asset into an executable script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Clickjacking protection. SAMEORIGIN rather than DENY so the site can
  // still be previewed in a same-origin frame during development.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Send the full URL to same-origin, only the origin cross-origin. Keeps
  // referrer analytics useful without leaking paths to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  /**
   * Powerful features this site never uses are switched off outright.
   *
   * `xr-spatial-tracking` is deliberately NOT disabled: the WebGL layer is
   * built on react-three-fiber and WebXR is a plausible future use of it.
   * Everything listed here is genuinely unused.
   */
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "interest-cohort=()",
    ].join(", "),
  },

  // Isolates the browsing context from cross-origin popups it never opens.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

  // Upgrade-only. HSTS is intentionally omitted here — see the notes below.
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/**
 * DELIBERATELY NOT SET, and why:
 *
 * - Content-Security-Policy
 *     Next's App Router injects inline bootstrap and flight-data scripts,
 *     and next/font emits an inline style block. A CSP strict enough to be
 *     worth having needs a per-request nonce threaded through middleware,
 *     which is a real architectural change rather than a config line — and
 *     a wrong `script-src` here would break hydration, the GSAP clock and
 *     the WebGL canvas in one go. Left for a deliberate pass with a nonce
 *     provider, rather than shipped half-configured.
 *
 * - Cross-Origin-Embedder-Policy: require-corp
 *     Would block any cross-origin asset lacking CORP headers. Nothing
 *     needs it today (no SharedArrayBuffer, no threaded WASM), and it is a
 *     common cause of silently blank WebGL canvases. Not worth the risk.
 *
 * - Strict-Transport-Security
 *     Correct to set, but it belongs at the platform/CDN edge where the
 *     apex domain and any subdomains are known. Setting it from the app
 *     with a guessed `includeSubDomains` can lock out a subdomain that does
 *     not have TLS yet. Enable at the host once the real domain is live.
 */

const nextConfig: NextConfig = {
  // Required from Next 13.1+: the three.js add-on ecosystem ships untranspiled
  // ESM that the server compiler otherwise chokes on.
  transpilePackages: ["three"],

  // Do not leak the framework version in a response header.
  poweredByHeader: false,

  images: {
    // AVIF first, WebP fallback. Both are materially smaller than the
    // source JPEG/PNG for the kind of imagery this portfolio will carry.
    formats: ["image/avif", "image/webp"],
    // Only the qualities actually used are generated; anything else 404s
    // rather than silently producing a second set of derivatives.
    qualities: [82],
    // The widths the layout actually asks for, so no oversized derivative
    // is ever built for a slot that cannot display it.
    deviceSizes: [430, 768, 1024, 1280, 1600, 1920, 2560],
    imageSizes: [256, 384, 576, 768],
  },

  experimental: {
    // Keeps drei's barrel import from pulling its entire dependency tail
    // (troika, mediapipe, hls.js) into the client bundle.
    optimizePackageImports: ["@react-three/drei"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
