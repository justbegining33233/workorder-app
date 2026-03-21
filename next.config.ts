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
          { key: 'Permissions-Policy',        value: 'camera=(self), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy',   value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; font-src 'self'; connect-src 'self' https://api.stripe.com https://*.sentry.io wss://*.fixtray.app wss://localhost:* ws://localhost:*; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" },
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
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Note: custom webpack function removed to avoid Turbopack/webpack detection
  // Use memory cache in dev to avoid filling C: drive with .next cache
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: "fixtray",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
