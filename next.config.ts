import type { NextConfig } from "next";
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const nextConfig: NextConfig = {
  // Disable pages router since we're using app router
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
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

export default nextConfig;
