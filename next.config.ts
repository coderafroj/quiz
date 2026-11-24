import type { NextConfig } from "next";

// Security headers for every route. A full Content-Security-Policy is
// deliberately not set here: Firebase Auth popups and Next.js inline
// scripts make a strict CSP easy to get wrong and break sign-in — add one
// later with report-only mode first.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Needed so the Google sign-in popup can talk back to the page.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise the framework
  compress: true,
  experimental: {
    // Smaller client bundles: only import the icons / motion helpers actually used.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Long-lived caching for static brand assets.
        source: "/(icon-192.png|icon-512.png|logo-mark.svg)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
