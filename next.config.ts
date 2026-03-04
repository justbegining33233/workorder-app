import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const nextConfig: NextConfig = {
  // Disable pages router since we're using app router
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  // Prevent Next.js from bundling optional server-side packages that are
  // dynamically imported at runtime only (e.g. email/SMS providers).
  serverExternalPackages: ['resend', 'twilio'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.yourdomain.com',
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Note: custom webpack function removed to avoid Turbopack/webpack detection
};

export default withSentryConfig(nextConfig, {
  org: "fixtray",
  project: "javascript-nextjs",
  // Suppresses source map uploading logs during build
  silent: !process.env.CI,
  // Upload source maps to Sentry for better stack traces
  widenClientFileUpload: true,
  // Transpile SDK to be compatible with IE11
  transpileClientSDK: false,
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
