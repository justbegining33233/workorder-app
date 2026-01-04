import type { NextConfig } from "next";
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const nextConfig: NextConfig = {
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
  async headers() {
    return [
      {
        source: "/:all*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ];
  },
  // Note: custom webpack function removed to avoid Turbopack/webpack detection
};

export default nextConfig;
